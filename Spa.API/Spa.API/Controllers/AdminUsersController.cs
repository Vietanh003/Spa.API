using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Security;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = AppRoles.Admin)]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminUsersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _db.NhanViens
            .AsNoTracking()
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.HoTen)
            .Select(x => new
            {
                x.Id,
                x.HoTen,
                x.GioiTinh,
                x.DienThoai,
                x.DiaChi,
                x.DbLoginName,
                x.ChucVu,
                x.IsActive,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("roles")]
    public IActionResult GetRoles()
    {
        return Ok(AppRoles.Supported);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminUpdateUserDto dto)
    {
        var hoTen = (dto.HoTen ?? string.Empty).Trim();
        var gioiTinh = string.IsNullOrWhiteSpace(dto.GioiTinh) ? "Khac" : dto.GioiTinh.Trim();
        var dienThoai = (dto.DienThoai ?? string.Empty).Trim();
        var diaChi = string.IsNullOrWhiteSpace(dto.DiaChi) ? null : dto.DiaChi.Trim();
        var role = string.IsNullOrWhiteSpace(dto.ChucVu) ? AppRoles.Receptionist : dto.ChucVu.Trim();

        if (string.IsNullOrWhiteSpace(hoTen)) return BadRequest("HoTen la bat buoc.");
        if (string.IsNullOrWhiteSpace(dienThoai)) return BadRequest("DienThoai la bat buoc.");
        if (!AppRoles.IsSupported(role)) return BadRequest($"ChucVu khong hop le. Ho tro: {string.Join(", ", AppRoles.Supported)}");

        var user = await _db.NhanViens.FirstOrDefaultAsync(x => x.Id == id);
        if (user is null) return NotFound("Khong tim thay tai khoan.");

        user.HoTen = hoTen;
        user.GioiTinh = gioiTinh;
        user.DienThoai = dienThoai;
        user.DiaChi = diaChi;
        user.ChucVu = role;
        user.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }
}
