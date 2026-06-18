using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;

[ApiController]
[Route("api/public/dich-vu")]
public class DichVuPublicController : ControllerBase
{
    private readonly AppDbContext _db;
    public DichVuPublicController(AppDbContext db) => _db = db;

    // GET: api/public/dich-vu?danhMucId=1&q=goi
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? danhMucId, [FromQuery] string? q)
    {
        var query = _db.DichVus.AsNoTracking()
            .Include(x => x.DanhMucDichVu)
            .Where(x => x.IsActive && x.IsOnlineVisible)
            .AsQueryable();

        if (danhMucId.HasValue) query = query.Where(x => x.DanhMucId == danhMucId.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            query = query.Where(x => x.TenDichVu.Contains(q) || x.MaDichVu.Contains(q));
        }

        var data = await query
            .OrderBy(x => x.ThuTuHienThi).ThenBy(x => x.TenDichVu)
            .Select(x => new
            {
                x.Id,
                x.MaDichVu,
                x.TenDichVu,
                x.MoTaNgan,
                x.GiaHienTai,
                x.GiaGoc,
                x.PhanTramGiam,
                x.ThoiLuongPhut,
                x.SoBuoi,
                x.HinhAnhChinh,
                x.Slug,
                x.DanhMucId,
                DanhMucTen = x.DanhMucDichVu != null ? x.DanhMucDichVu.TenDanhMuc : null
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/public/dich-vu/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dv = await _db.DichVus.AsNoTracking()
            .Include(x => x.DanhMucDichVu)
            .Where(x => x.Id == id && x.IsActive && x.IsOnlineVisible)
            .Select(x => new
            {
                x.Id,
                x.MaDichVu,
                x.TenDichVu,
                x.MoTaNgan,
                x.MoTa,
                x.LieuTrinh,
                x.GiaHienTai,
                x.GiaGoc,
                x.PhanTramGiam,
                x.ApDungTu,
                x.ApDungDen,
                x.ThoiLuongPhut,
                x.SoBuoi,
                x.ThoiGianHieuLucNgay,
                x.IsCombo,
                x.HinhAnhChinh,
                x.HinhAnhJson,
                x.Slug,
                x.MetaTitle,
                x.MetaDescription,
                x.DanhMucId,
                DanhMucTen = x.DanhMucDichVu != null ? x.DanhMucDichVu.TenDanhMuc : null
            })
            .FirstOrDefaultAsync();

        if (dv is null) return NotFound("Không tìm thấy dịch vụ hoặc dịch vụ không còn hiển thị.");
        return Ok(dv);
    }
}
