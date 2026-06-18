using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Security;
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
    public async Task<IActionResult> Login([FromBody] AuthLoginDto req)
    {
        var nv = await _db.NhanViens.AsNoTracking()
            .FirstOrDefaultAsync(x => x.DbLoginName == req.DbLoginName && x.IsActive);

        if (nv is null) return Unauthorized("Sai tài khoản hoặc tài khoản bị khóa.");

        if (nv.PasswordSalt == null || nv.PasswordSalt.Length != 16 ||
            nv.PasswordHashSha == null || nv.PasswordHashSha.Length != 32)
            return Unauthorized("Tài khoản chưa thiết lập mật khẩu.");

        var computed = NhanVienPasswordHasher.ComputeHash(nv.PasswordSalt, req.Password);

        if (!NhanVienPasswordHasher.VerifyHash(computed, nv.PasswordHashSha))
            return Unauthorized("Sai mật khẩu.");

        var token = GenerateJwt(nv.Id, nv.DbLoginName, nv.HoTen, nv.ChucVu);
        return Ok(new { token, role = nv.ChucVu, login = nv.DbLoginName, fullName = nv.HoTen });
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost("/api/admin/users")]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserDto dto)
    {
        var login = (dto.DbLoginName ?? string.Empty).Trim();
        var password = dto.Password ?? string.Empty;
        var hoTen = (dto.HoTen ?? string.Empty).Trim();
        var gioiTinh = string.IsNullOrWhiteSpace(dto.GioiTinh) ? "Khác" : dto.GioiTinh.Trim();
        var dienThoai = (dto.DienThoai ?? string.Empty).Trim();
        var diaChi = string.IsNullOrWhiteSpace(dto.DiaChi) ? null : dto.DiaChi.Trim();
        var role = string.IsNullOrWhiteSpace(dto.ChucVu) ? AppRoles.Receptionist : dto.ChucVu.Trim();

        if (string.IsNullOrWhiteSpace(login)) return BadRequest("DbLoginName là bắt buộc.");
        if (string.IsNullOrWhiteSpace(password) || password.Length < 6) return BadRequest("Password tối thiểu 6 ký tự.");
        if (string.IsNullOrWhiteSpace(hoTen)) return BadRequest("HoTen là bắt buộc.");
        if (string.IsNullOrWhiteSpace(gioiTinh)) return BadRequest("GioiTinh là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dienThoai)) return BadRequest("DienThoai là bắt buộc.");
        if (!AppRoles.IsSupported(role)) return BadRequest($"ChucVu không hợp lệ. Hỗ trợ: {string.Join(", ", AppRoles.Supported)}");

        var exists = await _db.NhanViens.AnyAsync(x => x.DbLoginName == login);
        if (exists) return Conflict("DbLoginName đã tồn tại.");

        var salt = NhanVienPasswordHasher.CreateSalt();
        var hash = NhanVienPasswordHasher.ComputeHash(salt, password);

        var nv = new Spa.API.Entities.NhanVien
        {
            HoTen = hoTen,
            GioiTinh = gioiTinh,
            DienThoai = dienThoai,
            DiaChi = diaChi,
            ChucVu = role,
            DbLoginName = login,
            IsActive = dto.IsActive,
            PasswordSalt = salt,
            PasswordHashSha = hash,
        };

        _db.NhanViens.Add(nv);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            id = nv.Id,
            login = nv.DbLoginName,
            role = nv.ChucVu,
            isActive = nv.IsActive,
        });
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
        var normalizedRole = string.IsNullOrWhiteSpace(role) ? AppRoles.Receptionist : role.Trim();

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
            new Claim(ClaimTypes.Name, login),
            new Claim("full_name", fullName),
            new Claim(ClaimTypes.Role, normalizedRole)
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
