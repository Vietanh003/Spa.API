using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.Security;
using System.Security.Cryptography;
using System.Text;

namespace Spa.API.Controllers;

/// <summary>
/// Endpoint khởi tạo dùng MỘT LẦN cho deploy mới — tạo admin đầu tiên.
/// Bảo vệ bằng header "X-Setup-Token" so với env "SETUP_TOKEN".
/// </summary>
[ApiController]
[Route("api/setup")]
public class SetupController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public SetupController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public sealed class SeedAdminDto
    {
        public string DbLoginName { get; set; } = "admin";
        public string Password { get; set; } = "";
        public string HoTen { get; set; } = "Quản trị";
    }

    [HttpPost("seed-admin")]
    public async Task<IActionResult> SeedAdmin([FromBody] SeedAdminDto dto, [FromHeader(Name = "X-Setup-Token")] string? token)
    {
        var expected = _config["Setup:Token"] ?? Environment.GetEnvironmentVariable("SETUP_TOKEN");
        if (string.IsNullOrWhiteSpace(expected))
            return StatusCode(503, "Chức năng setup chưa được bật (thiếu SETUP_TOKEN).");
        if (token != expected) return Unauthorized("Sai X-Setup-Token.");

        var login = (dto.DbLoginName ?? "").Trim();
        var pwd = dto.Password ?? "";
        var hoTen = string.IsNullOrWhiteSpace(dto.HoTen) ? "Quản trị" : dto.HoTen.Trim();

        if (string.IsNullOrWhiteSpace(login)) return BadRequest("DbLoginName là bắt buộc.");
        if (pwd.Length < 6) return BadRequest("Password tối thiểu 6 ký tự.");

        var hasAny = await _db.NhanViens.AsNoTracking().AnyAsync();
        if (hasAny) return Conflict("Đã có tài khoản — endpoint chỉ chạy khi DB còn rỗng.");

        var salt = NhanVienPasswordHasher.CreateSalt();
        var hash = NhanVienPasswordHasher.ComputeHash(salt, pwd);

        var nv = new Entities.NhanVien
        {
            HoTen = hoTen,
            GioiTinh = "Khác",
            DienThoai = "",
            ChucVu = AppRoles.Admin,
            DbLoginName = login,
            IsActive = true,
            PasswordSalt = salt,
            PasswordHashSha = hash,
        };

        _db.NhanViens.Add(nv);
        await _db.SaveChangesAsync();

        return Ok(new { id = nv.Id, login = nv.DbLoginName, message = "Tạo admin thành công. Hãy xoá biến SETUP_TOKEN sau khi dùng." });
    }

}
