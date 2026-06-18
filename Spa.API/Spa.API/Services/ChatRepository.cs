using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Spa.API.Services;

public sealed class ChatRepository : IChatRepository
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _environment;

    public ChatRepository(AppDbContext db, IWebHostEnvironment environment)
    {
        _db = db;
        _environment = environment;
    }

    public async Task<ChatRepositoryResult> GetBusinessContextAsync(
        ChatIntent intent,
        string question,
        CancellationToken cancellationToken = default)
    {
        return intent switch
        {
            ChatIntent.ServiceSearch or ChatIntent.ServicePrice or ChatIntent.GeneralConsultation or ChatIntent.Promotion
                => Combine(
                    await GetServicesAsync(question, cancellationToken),
                    GetFileKnowledgeContext(question)),
            ChatIntent.Booking
                => await GetBookingContextAsync(question, cancellationToken),
            ChatIntent.CustomerInformation
                => await GetCustomerContextAsync(question, cancellationToken),
            ChatIntent.ProductSearch or ChatIntent.ProductPrice or ChatIntent.ProductStock
                => MissingSchema("Products"),
            ChatIntent.OrderStatus
                => MissingSchema("Orders"),
            _ => new ChatRepositoryResult("Không cần truy vấn dữ liệu.", "No database query was required.")
        };
    }

    private async Task<ChatRepositoryResult> GetServicesAsync(string question, CancellationToken cancellationToken)
    {
        var rows = await _db.DichVus.AsNoTracking()
            .Include(x => x.DanhMucDichVu)
            .Where(x => x.IsActive && x.IsOnlineVisible)
            .OrderBy(x => x.ThuTuHienThi)
            .ThenBy(x => x.TenDichVu)
            .Take(80)
            .Select(x => new
            {
                x.TenDichVu,
                DanhMuc = x.DanhMucDichVu != null ? x.DanhMucDichVu.TenDanhMuc : null,
                x.GiaHienTai,
                x.GiaGoc,
                x.PhanTramGiam,
                x.ThoiLuongPhut,
                x.SoBuoi,
                x.MoTaNgan,
                x.ApDungTu,
                x.ApDungDen
            })
            .ToListAsync(cancellationToken);

        var questionTokens = Tokenize(question).ToArray();
        var scoredRows = rows
            .Select(x => new
            {
                Row = x,
                Score = Score(questionTokens, string.Join(' ', x.TenDichVu, x.DanhMuc, x.MoTaNgan, x.GiaHienTai.ToString("N0")))
            })
            .Where(x => questionTokens.Length == 0 || x.Score > 0 || rows.Count <= 8)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Row.TenDichVu)
            .Take(8)
            .Select(x => x.Row)
            .ToList();

        if (scoredRows.Count == 0)
        {
            return new ChatRepositoryResult(
                "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.",
                "DichVu retrieval: 0 rows");
        }

        var lines = scoredRows.Select(x =>
            $"- Dịch vụ: {x.TenDichVu}; Danh mục: {x.DanhMuc ?? "Chưa phân loại"}; Giá hiện tại: {x.GiaHienTai:N0} VND; Giá gốc: {(x.GiaGoc.HasValue ? $"{x.GiaGoc:N0} VND" : "Không có")}; Giảm: {(x.PhanTramGiam.HasValue ? $"{x.PhanTramGiam:N0}%" : "Không có")}; Thời lượng: {x.ThoiLuongPhut} phút; Số buổi: {(x.SoBuoi.HasValue ? x.SoBuoi.Value.ToString() : "Không có")}; Mô tả: {x.MoTaNgan ?? "Không có"}");

        return new ChatRepositoryResult(
            string.Join(Environment.NewLine, lines),
            $"DichVu retrieval: {scoredRows.Count}/{rows.Count} rows");
    }

    private ChatRepositoryResult GetFileKnowledgeContext(string question)
    {
        var knowledgeDir = Path.Combine(_environment.ContentRootPath, "Knowledge");
        if (!Directory.Exists(knowledgeDir))
        {
            return new ChatRepositoryResult("", "Knowledge directory not found.");
        }

        var questionTokens = Tokenize(question).ToArray();
        var chunks = Directory
            .EnumerateFiles(knowledgeDir, "*.*", SearchOption.AllDirectories)
            .Where(x =>
                x.EndsWith(".md", StringComparison.OrdinalIgnoreCase) ||
                x.EndsWith(".txt", StringComparison.OrdinalIgnoreCase) ||
                x.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            .SelectMany(file => ReadKnowledgeChunks(file, knowledgeDir))
            .Select(x => new
            {
                x.Source,
                x.Text,
                Score = Score(questionTokens, x.Text)
            })
            .Where(x => questionTokens.Length == 0 || x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Source)
            .Take(5)
            .ToList();

        if (chunks.Count == 0)
        {
            return new ChatRepositoryResult("", "Knowledge file retrieval: 0 chunks");
        }

        var lines = chunks.Select(x => $"- Knowledge ({x.Source}): {x.Text}");
        return new ChatRepositoryResult(
            string.Join(Environment.NewLine, lines),
            $"Knowledge file retrieval: {chunks.Count} chunks");
    }

    private static IEnumerable<KnowledgeChunk> ReadKnowledgeChunks(string file, string root)
    {
        var source = Path.GetRelativePath(root, file);
        var text = File.ReadAllText(file);
        var chunks = Regex
            .Split(text, @"(\r?\n){2,}")
            .Select(x => x.Trim())
            .Where(x => x.Length > 0)
            .Select(x => x.Length <= 700 ? x : x[..700])
            .Take(80);

        foreach (var chunk in chunks)
        {
            yield return new KnowledgeChunk(source, chunk.ReplaceLineEndings(" "));
        }
    }

    private async Task<ChatRepositoryResult> GetBookingContextAsync(string question, CancellationToken cancellationToken)
    {
        var keyword = ExtractKeyword(question);
        var query = _db.LichHens.AsNoTracking()
            .Include(x => x.DichVu)
            .OrderByDescending(x => x.NgayHen)
            .ThenByDescending(x => x.GioHen)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(x =>
                x.HoTenKhach.Contains(keyword) ||
                x.DienThoaiKhach.Contains(keyword) ||
                (x.EmailKhach != null && x.EmailKhach.Contains(keyword)) ||
                (x.DichVu != null && x.DichVu.TenDichVu.Contains(keyword)));
        }

        var rows = await query
            .Take(5)
            .Select(x => new
            {
                x.HoTenKhach,
                x.DienThoaiKhach,
                x.EmailKhach,
                x.NgayHen,
                x.GioHen,
                x.TrangThai,
                DichVu = x.DichVu != null ? x.DichVu.TenDichVu : null
            })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return new ChatRepositoryResult(
                "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.",
                $"LichHen search keyword='{keyword}': 0 rows");
        }

        var lines = rows.Select(x =>
            $"- Khách: {x.HoTenKhach}; Điện thoại: {x.DienThoaiKhach}; Email: {x.EmailKhach ?? "Không có"}; Dịch vụ: {x.DichVu ?? "Không có"}; Ngày giờ: {x.NgayHen:dd/MM/yyyy} {x.GioHen:HH\\:mm}; Trạng thái: {x.TrangThai}");

        return new ChatRepositoryResult(
            string.Join(Environment.NewLine, lines),
            $"LichHen search keyword='{keyword}': {rows.Count} rows");
    }

    private async Task<ChatRepositoryResult> GetCustomerContextAsync(string question, CancellationToken cancellationToken)
    {
        var keyword = ExtractKeyword(question);
        var query = _db.KhachHangs.AsNoTracking().Where(x => x.IsActive);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(x =>
                x.HoTen.Contains(keyword) ||
                x.Email.Contains(keyword));
        }

        var rows = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(5)
            .Select(x => new
            {
                x.HoTen,
                x.Email,
                x.EmailVerified,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return new ChatRepositoryResult(
                "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.",
                $"KhachHang search keyword='{keyword}': 0 rows");
        }

        var lines = rows.Select(x =>
            $"- Khách hàng: {x.HoTen}; Email: {x.Email}; Email xác thực: {(x.EmailVerified ? "Có" : "Chưa")}; Ngày tạo: {x.CreatedAt:dd/MM/yyyy}");

        return new ChatRepositoryResult(
            string.Join(Environment.NewLine, lines),
            $"KhachHang search keyword='{keyword}': {rows.Count} rows");
    }

    private static ChatRepositoryResult MissingSchema(string tableName)
    {
        return new ChatRepositoryResult(
            "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.",
            $"{tableName} table/entity is not available in the current database model.");
    }

    private static ChatRepositoryResult Combine(params ChatRepositoryResult[] results)
    {
        var context = string.Join(
            Environment.NewLine,
            results.Select(x => x.Context).Where(x => !string.IsNullOrWhiteSpace(x)));

        if (string.IsNullOrWhiteSpace(context))
        {
            context = "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.";
        }

        var queryResult = string.Join(
            " | ",
            results.Select(x => x.QueryResult).Where(x => !string.IsNullOrWhiteSpace(x)));

        return new ChatRepositoryResult(context, queryResult);
    }

    private static string ExtractKeyword(string question)
    {
        var normalized = question.Trim();
        var stopWords = new[]
        {
            "cho tôi biết", "tư vấn", "giá", "bao nhiêu", "còn hàng", "không", "dịch vụ",
            "sản phẩm", "đơn hàng", "lịch hẹn", "đặt lịch", "khuyến mãi", "ưu đãi",
            "toi", "muon", "hoi", "ve", "la", "co", "khong"
        };

        foreach (var word in stopWords)
        {
            normalized = normalized.Replace(word, "", StringComparison.OrdinalIgnoreCase);
        }

        return normalized.Trim(' ', '?', '.', ',', ':', ';', '"', '\'');
    }

    private static IEnumerable<string> Tokenize(string value)
    {
        var normalized = RemoveDiacritics(value).ToLowerInvariant();
        return Regex
            .Split(normalized, @"[^a-z0-9]+")
            .Where(x => x.Length >= 2)
            .Where(x => !StopTokens.Contains(x));
    }

    private static int Score(IReadOnlyCollection<string> questionTokens, string value)
    {
        if (questionTokens.Count == 0)
        {
            return 1;
        }

        var normalized = RemoveDiacritics(value).ToLowerInvariant();
        return questionTokens.Sum(token => normalized.Contains(token, StringComparison.Ordinal) ? 1 : 0);
    }

    private static string RemoveDiacritics(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private static readonly HashSet<string> StopTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "toi", "minh", "cho", "hoi", "biet", "ve", "la", "co", "khong", "bao", "nhieu",
        "dich", "vu", "spa", "gia", "tu", "van", "can", "muon", "giup", "khach"
    };

    private sealed record KnowledgeChunk(string Source, string Text);
}
