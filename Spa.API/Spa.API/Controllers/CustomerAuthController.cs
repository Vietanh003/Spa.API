using Google.Apis.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Entities;
using Spa.API.Security;
using Spa.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/customer/auth")]
public class CustomerAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailSender _emailSender;

    public CustomerAuthController(
        AppDbContext db,
        IConfiguration config,
        IEmailSender emailSender)
    {
        _db = db;
        _config = config;
        _emailSender = emailSender;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] CustomerGoogleLoginDto dto, CancellationToken ct)
    {
        var idToken = string.IsNullOrWhiteSpace(dto.IdToken) ? dto.Credential : dto.IdToken;
        if (string.IsNullOrWhiteSpace(idToken)) return BadRequest("Google ID token la bat buoc.");

        var clientId = _config["Google:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId)) return StatusCode(500, "Google:ClientId chua duoc cau hinh.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken.Trim(),
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                });
        }
        catch (InvalidJwtException)
        {
            return Unauthorized("Google ID token khong hop le.");
        }

        if (!payload.EmailVerified)
            return Unauthorized("Google email chua duoc xac minh.");

        var email = NormalizeEmail(payload.Email);
        if (string.IsNullOrWhiteSpace(email)) return Unauthorized("Google ID token khong co email.");
        if (string.IsNullOrWhiteSpace(payload.Subject)) return Unauthorized("Google ID token khong co subject.");

        var customer = await _db.KhachHangs.FirstOrDefaultAsync(x => x.GoogleSubject == payload.Subject, ct)
            ?? await _db.KhachHangs.FirstOrDefaultAsync(x => x.Email == email, ct);

        if (customer is null)
        {
            customer = new KhachHang
            {
                Email = email,
                HoTen = string.IsNullOrWhiteSpace(payload.Name) ? email : payload.Name.Trim(),
                GoogleSubject = payload.Subject,
                AvatarUrl = payload.Picture,
                EmailVerified = true,
            };
            _db.KhachHangs.Add(customer);
        }
        else
        {
            if (!customer.IsActive) return Forbid();
            if (!string.IsNullOrWhiteSpace(customer.GoogleSubject) && customer.GoogleSubject != payload.Subject)
                return Conflict("Email nay da duoc lien ket voi tai khoan Google khac.");

            customer.GoogleSubject = payload.Subject;
            customer.Email = email;
            customer.HoTen = string.IsNullOrWhiteSpace(payload.Name) ? customer.HoTen : payload.Name.Trim();
            customer.AvatarUrl = string.IsNullOrWhiteSpace(payload.Picture) ? customer.AvatarUrl : payload.Picture;
            customer.EmailVerified = true;
            customer.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(ToAuthResponse(customer));
    }

    [HttpPost("email/send-code")]
    public async Task<IActionResult> SendEmailCode([FromBody] CustomerSendEmailCodeDto dto, CancellationToken ct)
    {
        var email = NormalizeEmail(dto.Email);
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email la bat buoc.");

        var recent = await _db.EmailVerificationCodes
            .Where(x => x.Email == email && x.CreatedAt > DateTime.UtcNow.AddSeconds(-60))
            .AnyAsync(ct);
        if (recent) return BadRequest("Vui long doi 60 giay truoc khi gui lai ma.");

        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        _db.EmailVerificationCodes.Add(new EmailVerificationCode
        {
            Email = email,
            CodeHash = HashCodeValue(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
        });

        await _db.SaveChangesAsync(ct);
        await _emailSender.SendAsync(email, "Ma xac nhan DiemSuong SPA", $"Ma xac nhan cua ban la: {code}\nMa co hieu luc trong 10 phut.", ct);

        return Ok(new { message = "Da gui ma xac nhan." });
    }

    [HttpPost("email/verify-code")]
    public async Task<IActionResult> VerifyEmailCode([FromBody] CustomerVerifyEmailCodeDto dto, CancellationToken ct)
    {
        var email = NormalizeEmail(dto.Email);
        var code = (dto.Code ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email)) return BadRequest("Email la bat buoc.");
        if (code.Length != 6 || !code.All(char.IsDigit)) return BadRequest("Ma xac nhan khong hop le.");

        var codeHash = HashCodeValue(code);
        var record = await _db.EmailVerificationCodes
            .Where(x => x.Email == email && x.CodeHash == codeHash && x.UsedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (record is null || record.ExpiresAt < DateTime.UtcNow) return Unauthorized("Ma xac nhan sai hoac da het han.");

        record.UsedAt = DateTime.UtcNow;

        var customer = await _db.KhachHangs.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (customer is null)
        {
            customer = new KhachHang
            {
                Email = email,
                HoTen = email.Split('@')[0],
                EmailVerified = true,
            };
            _db.KhachHangs.Add(customer);
        }
        else
        {
            if (!customer.IsActive) return Forbid();
            customer.EmailVerified = true;
            customer.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return Ok(ToAuthResponse(customer));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        if (User.FindFirstValue(ClaimTypes.Role) != AppRoles.Customer) return Forbid();

        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            email = User.FindFirstValue(ClaimTypes.Email),
            fullName = User.FindFirstValue(ClaimTypes.Name),
            avatarUrl = User.FindFirstValue("avatar_url"),
            role = User.FindFirstValue(ClaimTypes.Role),
        });
    }

    private object ToAuthResponse(KhachHang customer)
    {
        return new
        {
            token = GenerateJwt(customer),
            user = new
            {
                id = customer.Id,
                email = customer.Email,
                fullName = customer.HoTen,
                avatarUrl = customer.AvatarUrl,
                role = AppRoles.Customer,
            }
        };
    }

    private string GenerateJwt(KhachHang customer)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new(ClaimTypes.Name, customer.HoTen),
            new(ClaimTypes.Email, customer.Email),
            new(ClaimTypes.Role, AppRoles.Customer),
        };

        if (!string.IsNullOrWhiteSpace(customer.AvatarUrl))
            claims.Add(new Claim("avatar_url", customer.AvatarUrl));

        var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwt["ExpireMinutes"] ?? "720"));
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string NormalizeEmail(string? email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static string HashCodeValue(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

}
