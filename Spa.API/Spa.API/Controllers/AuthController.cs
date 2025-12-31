using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Spa.API.Data;
using Spa.Api.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;

namespace Spa.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthLoginDto req)
    {
        var nv = await _db.NhanViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DbLoginName == req.DbLoginName && x.IsActive);

        if (nv is null) return Unauthorized("Sai tài khoản hoặc tài khoản bị khóa.");

        if (nv.PasswordSalt == null || nv.PasswordSalt.Length != 16 ||
            nv.PasswordHashSha == null || nv.PasswordHashSha.Length != 32)
            return Unauthorized("Tài khoản chưa thiết lập mật khẩu.");

        var computed = ComputeSha256(nv.PasswordSalt, req.Password);

        if (!CryptographicOperations.FixedTimeEquals(computed, nv.PasswordHashSha))
            return Unauthorized("Sai mật khẩu.");

        var token = GenerateJwt(nv.Id, nv.DbLoginName, nv.HoTen, nv.ChucVu);
        return Ok(new { token });
    }

    private static byte[] ComputeSha256(byte[] salt, string password)
    {
        // Phải dùng Unicode để match SQL: CONVERT(VARBINARY(MAX), NVARCHAR)
        var pwBytes = Encoding.Unicode.GetBytes(password);

        var data = new byte[salt.Length + pwBytes.Length];
        Buffer.BlockCopy(salt, 0, data, 0, salt.Length);
        Buffer.BlockCopy(pwBytes, 0, data, salt.Length, pwBytes.Length);

        using var sha = SHA256.Create();
        return sha.ComputeHash(data);
    }
    // Endpoint xem thông tin token (test)
    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            login = User.FindFirstValue(ClaimTypes.Name),
            fullName = User.FindFirstValue("full_name"),
            role = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    private string GenerateJwt(int id, string login, string fullName, string role)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
            new Claim(ClaimTypes.Name, login),
            new Claim("full_name", fullName),
            new Claim(ClaimTypes.Role, role)
        };

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
}
