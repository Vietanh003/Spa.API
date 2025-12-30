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
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var nv = await _db.NhanViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DbLoginName == req.DbLoginName && x.IsActive);

        if (nv is null) return Unauthorized("Sai tài khoản hoặc tài khoản bị khóa.");
        if (string.IsNullOrWhiteSpace(nv.PasswordHash)) return Unauthorized("Tài khoản chưa thiết lập mật khẩu.");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, nv.PasswordHash))
            return Unauthorized("Sai mật khẩu.");

        var token = GenerateJwt(nv.Id, nv.DbLoginName, nv.HoTen, nv.ChucVu);
        return Ok(new { token });
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
