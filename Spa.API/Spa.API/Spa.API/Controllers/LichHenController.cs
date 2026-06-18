using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Security;
using System.Security.Claims;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/lich-hen")]
public class LichHenController : ControllerBase
{
    private readonly AppDbContext _db;

    // Giờ làm việc mặc định: 09:00 - 21:00
    private static readonly TimeOnly WorkStart = new(9, 0);
    private static readonly TimeOnly WorkEnd = new(21, 0);
    public LichHenController(AppDbContext db) => _db = db;

    // GET: api/lich-hen (nhân viên xem danh sách lịch hẹn)
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Receptionist)]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] string? status,
        [FromQuery] int? nhanVienId,
        [FromQuery] int take = 200)
    {
        if (take <= 0 || take > 1000) return BadRequest("take phải nằm trong khoảng 1..1000");

        var query = _db.LichHens.AsNoTracking().AsQueryable();

        if (from.HasValue) query = query.Where(x => x.NgayHen >= from.Value);
        if (to.HasValue) query = query.Where(x => x.NgayHen <= to.Value);

        if (!string.IsNullOrWhiteSpace(status))
        {
            status = status.Trim();
            query = query.Where(x => x.TrangThai == status);
        }

        if (nhanVienId.HasValue) query = query.Where(x => x.NhanVienId == nhanVienId.Value);

        var data = await query
            .OrderByDescending(x => x.NgayHen).ThenByDescending(x => x.GioHen)
            .Select(x => new
            {
                x.Id,
                x.KhachHangId,
                x.NgayHen,
                x.GioHen,
                x.ThoiLuongDuKien,
                x.TrangThai,
                x.DichVuId,
                TenDichVu = x.DichVu != null ? x.DichVu.TenDichVu : null,
                x.NhanVienId,
                x.HoTenKhach,
                x.DienThoaiKhach,
                x.EmailKhach,
                x.GhiChuKhach,
                x.GhiChuNoiBo,
                x.CreatedAt,
                x.UpdatedAt,
                x.DaDen
            })
            .Take(take)
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/lich-hen/{id}
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Receptionist)]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lh = await _db.LichHens.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.KhachHangId,
                x.HoTenKhach,
                x.DienThoaiKhach,
                x.EmailKhach,
                x.NgayHen,
                x.GioHen,
                x.ThoiLuongDuKien,
                x.NhanVienId,
                x.DichVuId,
                TenDichVu = x.DichVu != null ? x.DichVu.TenDichVu : null,
                x.GhiChuKhach,
                x.GhiChuNoiBo,
                x.TrangThai,
                x.LyDoHuy,
                x.CreatedAt,
                x.UpdatedAt,
                x.DaDen
            })
            .FirstOrDefaultAsync();

        if (lh is null) return NotFound("Không tìm thấy lịch hẹn.");
        return Ok(lh);
    }

    // POST: api/lich-hen (khách hàng tạo lịch hẹn)
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Create([FromBody] LichHenCreateDto dto)
    {
        dto.HoTenKhach = (dto.HoTenKhach ?? "").Trim();
        dto.DienThoaiKhach = (dto.DienThoaiKhach ?? "").Trim();
        dto.EmailKhach = string.IsNullOrWhiteSpace(dto.EmailKhach) ? null : dto.EmailKhach.Trim();
        dto.GhiChuKhach = string.IsNullOrWhiteSpace(dto.GhiChuKhach) ? null : dto.GhiChuKhach.Trim();

        var customerId = GetCustomerId();
        if (customerId.HasValue)
        {
            var customer = await _db.KhachHangs.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == customerId.Value && x.IsActive);
            if (customer is null) return Unauthorized("Tai khoan khach hang khong hop le.");

            dto.HoTenKhach = string.IsNullOrWhiteSpace(dto.HoTenKhach) ? customer.HoTen : dto.HoTenKhach;
            dto.EmailKhach = customer.Email;
        }

        if (string.IsNullOrWhiteSpace(dto.HoTenKhach)) return BadRequest("HoTenKhach là bắt buộc.");
        if (string.IsNullOrWhiteSpace(dto.DienThoaiKhach)) return BadRequest("DienThoaiKhach là bắt buộc.");
        if (dto.DichVuId <= 0) return BadRequest("DichVuId không hợp lệ.");
        if (dto.NgayHen < DateOnly.FromDateTime(DateTime.Today)) return BadRequest("NgayHen không hợp lệ.");

        // giới hạn giờ làm việc
        if (dto.GioHen < WorkStart || dto.GioHen > WorkEnd) return BadRequest("GioHen nằm ngoài giờ làm việc.");

        // check dịch vụ tồn tại và đang hiển thị
        var dv = await _db.DichVus.AsNoTracking()
            .Where(x => x.Id == dto.DichVuId && x.IsActive && x.IsOnlineVisible)
            .Select(x => new { x.Id, x.ThoiLuongPhut })
            .FirstOrDefaultAsync();

        if (dv is null) return BadRequest("Dịch vụ không tồn tại hoặc không còn hiển thị.");

        var thoiLuong = dto.ThoiLuongDuKien.HasValue && dto.ThoiLuongDuKien.Value > 0
            ? dto.ThoiLuongDuKien.Value
            : dv.ThoiLuongPhut;

        if (thoiLuong <= 0) return BadRequest("ThoiLuongDuKien không hợp lệ.");

        // check trùng slot: (NgayHen, GioHen)
        var exists = await _db.LichHens.AsNoTracking()
            .AnyAsync(x => x.NgayHen == dto.NgayHen && x.GioHen == dto.GioHen && x.TrangThai != "Hủy");

        if (exists) return Conflict("Khung giờ này đã có lịch hẹn. Vui lòng chọn giờ khác.");

        var lh = new Entities.LichHen
        {
            HoTenKhach = dto.HoTenKhach,
            DienThoaiKhach = dto.DienThoaiKhach,
            EmailKhach = dto.EmailKhach,
            KhachHangId = customerId,
            NgayHen = dto.NgayHen,
            GioHen = dto.GioHen,
            ThoiLuongDuKien = thoiLuong,
            DichVuId = dto.DichVuId,
            GhiChuKhach = dto.GhiChuKhach,
            TrangThai = "Chờ xác nhận",
            CreatedAt = DateTime.Now,
            DaDen = false
        };

        _db.LichHens.Add(lh);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = lh.Id }, new { lh.Id });
    }

    // GET: api/lich-hen/my (khách hàng xem lịch đã đặt)
    [Authorize(Roles = AppRoles.Customer)]
    [HttpGet("my")]
    public async Task<IActionResult> MyBookings([FromQuery] int take = 50)
    {
        var customerId = GetCustomerId();
        if (!customerId.HasValue) return Unauthorized();
        if (take <= 0 || take > 200) return BadRequest("take phải nằm trong khoảng 1..200");

        var customer = await _db.KhachHangs.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == customerId.Value && x.IsActive);
        if (customer is null) return Unauthorized();

        var data = await _db.LichHens.AsNoTracking()
            .Where(x => x.KhachHangId == customerId.Value || x.EmailKhach == customer.Email)
            .OrderByDescending(x => x.NgayHen)
            .ThenByDescending(x => x.GioHen)
            .Select(x => new
            {
                x.Id,
                x.NgayHen,
                x.GioHen,
                x.ThoiLuongDuKien,
                x.TrangThai,
                x.DichVuId,
                TenDichVu = x.DichVu != null ? x.DichVu.TenDichVu : null,
                x.HoTenKhach,
                x.DienThoaiKhach,
                x.EmailKhach,
                x.GhiChuKhach,
                x.LyDoHuy,
                x.CreatedAt,
                x.UpdatedAt,
                x.DaDen
            })
            .Take(take)
            .ToListAsync();

        return Ok(data);
    }

    // PUT: api/lich-hen/{id}/confirm (nhân viên xác nhận)
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Receptionist)]
    [HttpPut("{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id, [FromBody] LichHenConfirmDto dto)
    {
        var lh = await _db.LichHens.FirstOrDefaultAsync(x => x.Id == id);
        if (lh is null) return NotFound("Không tìm thấy lịch hẹn.");

        if (lh.TrangThai == "Hủy") return BadRequest("Lịch hẹn đã bị hủy.");
        if (lh.TrangThai == "Đã xác nhận") return Ok(new { message = "OK" });

        if (dto.NhanVienId.HasValue)
        {
            var nvOk = await _db.NhanViens.AsNoTracking()
                .AnyAsync(x => x.Id == dto.NhanVienId.Value && x.IsActive);
            if (!nvOk) return BadRequest("NhanVienId không tồn tại hoặc bị khóa.");
            lh.NhanVienId = dto.NhanVienId.Value;
        }

        lh.GhiChuNoiBo = string.IsNullOrWhiteSpace(dto.GhiChuNoiBo) ? null : dto.GhiChuNoiBo.Trim();
        lh.TrangThai = "Đã xác nhận";
        lh.UpdatedAt = DateTime.Now;

        lh.UpdatedBy = User.Identity?.Name;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // PUT: api/lich-hen/{id}/complete (nhân viên đánh dấu hoàn thành)
    [Authorize(Roles = AppRoles.Admin + "," + AppRoles.Receptionist)]
    [HttpPut("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var lh = await _db.LichHens.FirstOrDefaultAsync(x => x.Id == id);
        if (lh is null) return NotFound("Không tìm thấy lịch hẹn.");

        if (lh.TrangThai == "Hủy") return BadRequest("Lịch hẹn đã bị hủy.");
        if (lh.TrangThai == "Hoàn thành") return Ok(new { message = "OK" });
        if (lh.TrangThai != "Đã xác nhận") return BadRequest("Chỉ lịch hẹn đã xác nhận mới được cập nhật Hoàn thành.");

        lh.TrangThai = "Hoàn thành";
        lh.DaDen = true;
        lh.UpdatedAt = DateTime.Now;
        lh.UpdatedBy = User.Identity?.Name;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // GET: api/lich-hen/available?from=2026-04-17&days=7&slotMinutes=30
    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<LichHenAvailabilityDayDto>>> GetAvailable(
        [FromQuery] DateOnly? from,
        [FromQuery] int days = 14,
        [FromQuery] int slotMinutes = 30)
    {
        if (days <= 0 || days > 60) return BadRequest("days phải nằm trong khoảng 1..60");
        if (slotMinutes <= 0 || slotMinutes > 240) return BadRequest("slotMinutes không hợp lệ.");
        if (slotMinutes % 5 != 0) return BadRequest("slotMinutes nên chia hết cho 5.");

        var startDate = from ?? DateOnly.FromDateTime(DateTime.Today);
        var endDateExclusive = startDate.AddDays(days);

        var booked = await _db.LichHens
            .AsNoTracking()
            .Where(x => x.NgayHen >= startDate && x.NgayHen < endDateExclusive)
            .Select(x => new { x.NgayHen, x.GioHen })
            .ToListAsync();

        var bookedByDay = booked
            .GroupBy(x => x.NgayHen)
            .ToDictionary(g => g.Key, g => g.Select(v => v.GioHen).ToHashSet());

        var result = new List<LichHenAvailabilityDayDto>(days);

        for (var i = 0; i < days; i++)
        {
            var date = startDate.AddDays(i);
            var slots = new List<TimeOnly>();

            var t = WorkStart;
            while (t.AddMinutes(slotMinutes) <= WorkEnd)
            {
                var isBooked = bookedByDay.TryGetValue(date, out var set) && set.Contains(t);
                if (!isBooked) slots.Add(t);

                t = t.AddMinutes(slotMinutes);
            }

            result.Add(new LichHenAvailabilityDayDto { Date = date, Slots = slots });
        }

        return Ok(result);
    }

    private int? GetCustomerId()
    {
        if (User.FindFirstValue(ClaimTypes.Role) != AppRoles.Customer) return null;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(raw, out var id) ? id : null;
    }
}
