using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Security;

namespace Spa.API.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.Admin + "," + AppRoles.Receptionist)]
public class LienHeController : ControllerBase
{
    private readonly AppDbContext _db;
    public LienHeController(AppDbContext db) => _db = db;

    // POST: api/public/lien-he  (khách hàng gửi tin nhắn)
    [HttpPost("api/public/lien-he")]
    [AllowAnonymous]
    public async Task<IActionResult> Submit([FromBody] LienHeCreateDto dto)
    {
        var hoTen = (dto.HoTen ?? "").Trim();
        var dienThoai = (dto.DienThoai ?? "").Trim();
        var email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        var loiNhan = (dto.LoiNhan ?? "").Trim();

        if (string.IsNullOrWhiteSpace(hoTen)) return BadRequest("Vui lòng nhập họ tên.");
        if (string.IsNullOrWhiteSpace(dienThoai)) return BadRequest("Vui lòng nhập số điện thoại.");
        if (string.IsNullOrWhiteSpace(loiNhan)) return BadRequest("Vui lòng nhập lời nhắn.");

        if (hoTen.Length > 200) return BadRequest("Họ tên quá dài (tối đa 200 ký tự).");
        if (dienThoai.Length > 20) return BadRequest("Số điện thoại quá dài.");
        if (!string.IsNullOrEmpty(email) && email.Length > 100) return BadRequest("Email quá dài.");
        if (loiNhan.Length > 2000) return BadRequest("Lời nhắn quá dài (tối đa 2000 ký tự).");

        var item = new Entities.LienHe
        {
            HoTen = hoTen,
            DienThoai = dienThoai,
            Email = email,
            LoiNhan = loiNhan,
            CreatedAt = DateTime.Now,
            DaXem = false,
        };

        _db.LienHes.Add(item);
        await _db.SaveChangesAsync();

        return Ok(new { id = item.Id, message = "Đã gửi tin nhắn. Sả sẽ liên hệ sớm." });
    }

    // GET: api/admin/lien-he?q=&unread=&take=
    [HttpGet("api/admin/lien-he")]
    public async Task<IActionResult> List(
        [FromQuery] string? q,
        [FromQuery] bool? unread,
        [FromQuery] int take = 200)
    {
        if (take <= 0 || take > 1000) return BadRequest("take phải nằm trong 1..1000");

        var query = _db.LienHes.AsNoTracking().AsQueryable();
        if (unread.HasValue) query = query.Where(x => x.DaXem == !unread.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var k = q.Trim();
            query = query.Where(x =>
                EF.Functions.Like(x.HoTen, $"%{k}%") ||
                EF.Functions.Like(x.DienThoai, $"%{k}%") ||
                (x.Email != null && EF.Functions.Like(x.Email, $"%{k}%")) ||
                EF.Functions.Like(x.LoiNhan, $"%{k}%"));
        }

        var data = await query
            .OrderByDescending(x => x.Id)
            .Take(take)
            .Select(x => new
            {
                x.Id,
                x.HoTen,
                x.DienThoai,
                x.Email,
                x.LoiNhan,
                x.CreatedAt,
                x.DaXem,
                x.XemLuc,
                x.XemBoi,
            })
            .ToListAsync();

        var unreadCount = await _db.LienHes.CountAsync(x => !x.DaXem);

        return Ok(new { items = data, unreadCount });
    }

    // GET: api/admin/lien-he/{id}
    [HttpGet("api/admin/lien-he/{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.LienHes.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.HoTen,
                x.DienThoai,
                x.Email,
                x.LoiNhan,
                x.CreatedAt,
                x.DaXem,
                x.XemLuc,
                x.XemBoi,
            })
            .FirstOrDefaultAsync();

        if (item is null) return NotFound();
        return Ok(item);
    }

    // PUT: api/admin/lien-he/{id}/read?value=true|false
    [HttpPut("api/admin/lien-he/{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, [FromQuery] bool value = true)
    {
        var item = await _db.LienHes.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        item.DaXem = value;
        if (value)
        {
            item.XemLuc = DateTime.Now;
            item.XemBoi = User.Identity?.Name;
        }
        else
        {
            item.XemLuc = null;
            item.XemBoi = null;
        }
        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // DELETE: api/admin/lien-he/{id}
    [HttpDelete("api/admin/lien-he/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.LienHes.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();
        _db.LienHes.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }
}
