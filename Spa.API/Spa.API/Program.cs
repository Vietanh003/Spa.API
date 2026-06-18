using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Spa.API.Data;
using Spa.API.Services;
using System.Text;

namespace Spa.Api;

public class Program
{
    public static void Main(string[] args)
    {
        // Npgsql 6+ siết DateTime.Kind cho timestamptz. Bật chế độ legacy để giữ DateTime.Now bình thường.
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

        var builder = WebApplication.CreateBuilder(args);

        // ----- CORS -----
        // Whitelist origin lấy từ env "Cors__Origins" (CSV) hoặc appsettings "Cors:Origins"
        var corsOrigins = (builder.Configuration["Cors:Origins"] ?? "http://localhost:5173")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        builder.Services.AddCors(opt =>
        {
            opt.AddPolicy("fe", p =>
                p.WithOrigins(corsOrigins)
                 .AllowAnyHeader()
                 .AllowAnyMethod()
            );
        });

        builder.Services.AddControllers();
        builder.Services.AddHttpClient();
        builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();

        // ----- Database (auto-detect SQL Server hoặc Postgres) -----
        // Đọc connection string từ env "ConnectionStrings__Default" hoặc appsettings.
        // Hỗ trợ thêm "DATABASE_URL" (Render/Heroku) cho prod.
        var rawConn = builder.Configuration.GetConnectionString("Default")
                      ?? Environment.GetEnvironmentVariable("DATABASE_URL")
                      ?? throw new InvalidOperationException("ConnectionStrings:Default (hoặc DATABASE_URL) chưa được cấu hình.");

        var (provider, connStr) = ResolveDbProvider(rawConn);

        builder.Services.AddDbContext<AppDbContext>(opt =>
        {
            if (provider == DbProvider.Postgres) opt.UseNpgsql(connStr);
            else opt.UseSqlServer(connStr);
        });

        // ----- JWT -----
        var jwt = builder.Configuration.GetSection("Jwt");
        var jwtKey = jwt["Key"] ?? throw new Exception("Jwt:Key is missing");

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidAudience = jwt["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ClockSkew = TimeSpan.FromSeconds(10)
                };
            });

        builder.Services.AddAuthorization();

        // ----- Cloudinary -----
        // Hỗ trợ CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloudname>) — chuẩn của Cloudinary.
        // Hoặc 3 biến rời: Cloudinary:CloudName / Cloudinary:ApiKey / Cloudinary:ApiSecret.
        var cloudinaryUrl = Environment.GetEnvironmentVariable("CLOUDINARY_URL")
                            ?? builder.Configuration["Cloudinary:Url"];
        var cloudinaryCloudName = builder.Configuration["Cloudinary:CloudName"]
                                  ?? Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
        var cloudinaryApiKey = builder.Configuration["Cloudinary:ApiKey"]
                               ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
        var cloudinaryApiSecret = builder.Configuration["Cloudinary:ApiSecret"]
                                  ?? Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");

        if (!string.IsNullOrWhiteSpace(cloudinaryUrl))
        {
            builder.Services.AddSingleton(_ =>
            {
                var c = new Cloudinary(cloudinaryUrl);
                c.Api.Secure = true;
                return c;
            });
        }


        else if (!string.IsNullOrWhiteSpace(cloudinaryCloudName)
                 && !string.IsNullOrWhiteSpace(cloudinaryApiKey)
                 && !string.IsNullOrWhiteSpace(cloudinaryApiSecret))
        {
            builder.Services.AddSingleton(_ =>
            {
                var account = new Account(cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret);
                var cli = new Cloudinary(account);
                cli.Api.Secure = true;
                return cli;
            });
        }

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        app.UseCors("fe");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        // Serve các file ảnh cũ đã lưu ở wwwroot/uploads (trước khi chuyển sang Cloudinary).
        // Ảnh mới sẽ đi lên Cloudinary; folder này chỉ để backward-compat cho data đã có.
        var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsRoot);
        app.UseStaticFiles();

        // Forwarded headers — quan trọng khi chạy sau reverse proxy (Render).
        var forwardedOptions = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
        };
        forwardedOptions.KnownIPNetworks.Clear();
        forwardedOptions.KnownProxies.Clear();
        app.UseForwardedHeaders(forwardedOptions);

        // Không bật HTTPS redirect — Render/Vercel đã terminate TLS.
        app.UseAuthentication();
        app.UseAuthorization();

        EnsureCustomerBookingSchema(app);

        app.MapControllers();
        app.MapGet("/", () => Results.Ok(new { ok = true, service = "Spa.API" }));
        app.MapGet("/health", () => Results.Ok(new { ok = true }));

        app.Run();
    }

    private static void EnsureCustomerBookingSchema(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var provider = db.Database.ProviderName ?? "";

        if (provider.Contains("Npgsql", StringComparison.OrdinalIgnoreCase))
        {
            db.Database.ExecuteSqlRaw("""
                ALTER TABLE "LichHen" ADD COLUMN IF NOT EXISTS "KhachHangId" integer NULL;
                CREATE INDEX IF NOT EXISTS "IX_LichHen_KhachHangId" ON "LichHen"("KhachHangId");
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'FK_LichHen_KhachHang_KhachHangId'
                    ) THEN
                        ALTER TABLE "LichHen"
                        ADD CONSTRAINT "FK_LichHen_KhachHang_KhachHangId"
                        FOREIGN KEY ("KhachHangId") REFERENCES "KhachHang"("Id") ON DELETE SET NULL;
                    END IF;
                END $$;
                """);
            return;
        }

        db.Database.ExecuteSqlRaw("""
            IF COL_LENGTH('dbo.LichHen', 'KhachHangId') IS NULL
                ALTER TABLE dbo.LichHen ADD KhachHangId INT NULL;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LichHen_KhachHangId' AND object_id = OBJECT_ID('dbo.LichHen'))
                CREATE INDEX IX_LichHen_KhachHangId ON dbo.LichHen(KhachHangId);

            IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_LichHen_KhachHang_KhachHangId')
                ALTER TABLE dbo.LichHen
                ADD CONSTRAINT FK_LichHen_KhachHang_KhachHangId
                FOREIGN KEY (KhachHangId) REFERENCES dbo.KhachHang(Id) ON DELETE SET NULL;
            """);
    }

    private enum DbProvider { SqlServer, Postgres }

    /// <summary>
    /// Tự đoán DB provider từ connection string:
    ///   - "postgres://..." / "postgresql://..." → Postgres (kèm normalize sang key=value form).
    ///   - Có "Host=" hoặc "Port=5432" → Postgres.
    ///   - Còn lại (có "Server=" / "Data Source=") → SQL Server.
    /// </summary>
    private static (DbProvider provider, string connStr) ResolveDbProvider(string raw)
    {
        var s = raw?.Trim() ?? "";
        if (string.IsNullOrEmpty(s))
            throw new InvalidOperationException("Connection string rỗng.");

        // URL form (Render/Heroku/Neon style)
        if (s.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            || s.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return (DbProvider.Postgres, NormalizeNpgsqlUrl(s));

        // Key=Value form — phân biệt qua keyword
        var lower = s.ToLowerInvariant();
        if (lower.Contains("host=") || lower.Contains("username=") || lower.Contains("pooling=true"))
            return (DbProvider.Postgres, s);

        return (DbProvider.SqlServer, s);
    }

    private static string NormalizeNpgsqlUrl(string raw)
    {
        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var db = uri.AbsolutePath.TrimStart('/');
        var port = uri.Port > 0 ? uri.Port : 5432;

        var sb = new StringBuilder();
        sb.Append($"Host={uri.Host};Port={port};Username={user};Password={pass};Database={db};");
        sb.Append("SSL Mode=Require;Trust Server Certificate=true;Pooling=true;Maximum Pool Size=10;");
        return sb.ToString();
    }
}
