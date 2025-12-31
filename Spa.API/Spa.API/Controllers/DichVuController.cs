using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Entities;

[ApiController]
[Route("api/dich-vu")]
public class DichVuController : ControllerBase
{
    private readonly AppDbContext _db;
    public DichVuController(AppDbContext db) => _db = db;

    // GET: api/dich-vu?active=true&danhMucId=1&q=goi
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? active, [FromQuery] int? danhMucId, [FromQuery] string? q)
    {
        var query = _db.DichVus.AsNoTracking()
            .Include(x => x.DanhMucDichVu)
            .AsQueryable();

        if (active.HasValue) query = query.Where(x => x.IsActive == active.Value);
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
                x.GiaHienTai,
                x.GiaGoc,
                x.ThoiLuongPhut,
                x.IsActive,
                x.IsOnlineVisible,
                x.DanhMucId,
                DanhMucTen = x.DanhMucDichVu != null ? x.DanhMucDichVu.TenDanhMuc : null
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/dich-vu/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dv = await _db.DichVus.AsNoTracking()
            .Include(x => x.DanhMucDichVu)
            .Where(x => x.Id == id)
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
                x.SKU,
                x.Barcode,
                x.IsCombo,
                x.IsOnlineVisible,
                x.IsActive,
                x.ThuTuHienThi,
                x.HinhAnhChinh,
                x.HinhAnhJson,
                x.Slug,
                x.MetaTitle,
                x.MetaDescription,
                x.DanhMucId,
                DanhMucTen = x.DanhMucDichVu != null ? x.DanhMucDichVu.TenDanhMuc : null
            })
            .FirstOrDefaultAsync();

        if (dv is null) return NotFound("Không tìm thấy dịch vụ.");
        return Ok(dv);
    }

    // POST: api/dich-vu
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DichVuCreateDto dto)
    {
        dto.MaDichVu = dto.MaDichVu?.Trim() ?? "";
        dto.TenDichVu = dto.TenDichVu?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(dto.MaDichVu) || string.IsNullOrWhiteSpace(dto.TenDichVu))
            return BadRequest("MaDichVu và TenDichVu là bắt buộc.");

        if (dto.GiaHienTai < 0) return BadRequest("GiaHienTai không hợp lệ.");
        if (dto.GiaGoc.HasValue && dto.GiaGoc.Value < dto.GiaHienTai) return BadRequest("GiaGoc phải >= GiaHienTai.");

        // check danh mục (nếu có)
        if (dto.DanhMucId.HasValue)
        {
            var dmOk = await _db.DanhMucDichVus.AnyAsync(x => x.Id == dto.DanhMucId.Value);
            if (!dmOk) return BadRequest("DanhMucId không tồn tại.");
        }

        var exists = await _db.DichVus.AnyAsync(x => x.MaDichVu == dto.MaDichVu);
        if (exists) return Conflict("MaDichVu đã tồn tại.");

        var dv = new DichVu
        {
            DanhMucId = dto.DanhMucId,
            MaDichVu = dto.MaDichVu,
            TenDichVu = dto.TenDichVu,
            MoTaNgan = dto.MoTaNgan,
            MoTa = dto.MoTa,
            LieuTrinh = dto.LieuTrinh,
            GiaHienTai = dto.GiaHienTai,
            GiaGoc = dto.GiaGoc,
            PhanTramGiam = dto.PhanTramGiam,
            ApDungTu = dto.ApDungTu,
            ApDungDen = dto.ApDungDen,
            ThoiLuongPhut = dto.ThoiLuongPhut,
            SoBuoi = dto.SoBuoi,
            ThoiGianHieuLucNgay = dto.ThoiGianHieuLucNgay,
            SKU = dto.SKU,
            Barcode = dto.Barcode,
            IsCombo = dto.IsCombo,
            IsOnlineVisible = dto.IsOnlineVisible,
            IsActive = dto.IsActive,
            ThuTuHienThi = dto.ThuTuHienThi,
            HinhAnhChinh = dto.HinhAnhChinh,
            HinhAnhJson = dto.HinhAnhJson,
            Slug = dto.Slug,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            CreatedAt = DateTime.Now
        };

        _db.DichVus.Add(dv);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = dv.Id }, new { dv.Id });
    }

    // PUT: api/dich-vu/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DichVuUpdateDto dto)
    {
        dto.TenDichVu = dto.TenDichVu?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(dto.TenDichVu))
            return BadRequest("TenDichVu là bắt buộc.");

        if (dto.GiaHienTai < 0) return BadRequest("GiaHienTai không hợp lệ.");
        if (dto.GiaGoc.HasValue && dto.GiaGoc.Value < dto.GiaHienTai) return BadRequest("GiaGoc phải >= GiaHienTai.");

        if (dto.DanhMucId.HasValue)
        {
            var dmOk = await _db.DanhMucDichVus.AnyAsync(x => x.Id == dto.DanhMucId.Value);
            if (!dmOk) return BadRequest("DanhMucId không tồn tại.");
        }

        var dv = await _db.DichVus.FirstOrDefaultAsync(x => x.Id == id);
        if (dv is null) return NotFound("Không tìm thấy dịch vụ.");

        dv.DanhMucId = dto.DanhMucId;
        dv.TenDichVu = dto.TenDichVu;
        dv.MoTaNgan = dto.MoTaNgan;
        dv.MoTa = dto.MoTa;
        dv.LieuTrinh = dto.LieuTrinh;
        dv.GiaHienTai = dto.GiaHienTai;
        dv.GiaGoc = dto.GiaGoc;
        dv.PhanTramGiam = dto.PhanTramGiam;
        dv.ApDungTu = dto.ApDungTu;
        dv.ApDungDen = dto.ApDungDen;
        dv.ThoiLuongPhut = dto.ThoiLuongPhut;
        dv.SoBuoi = dto.SoBuoi;
        dv.ThoiGianHieuLucNgay = dto.ThoiGianHieuLucNgay;
        dv.SKU = dto.SKU;
        dv.Barcode = dto.Barcode;
        dv.IsCombo = dto.IsCombo;
        dv.IsOnlineVisible = dto.IsOnlineVisible;
        dv.IsActive = dto.IsActive;
        dv.ThuTuHienThi = dto.ThuTuHienThi;
        dv.HinhAnhChinh = dto.HinhAnhChinh;
        dv.HinhAnhJson = dto.HinhAnhJson;
        dv.Slug = dto.Slug;
        dv.MetaTitle = dto.MetaTitle;
        dv.MetaDescription = dto.MetaDescription;
        dv.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // DELETE (soft): api/dich-vu/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var dv = await _db.DichVus.FirstOrDefaultAsync(x => x.Id == id);
        if (dv is null) return NotFound("Không tìm thấy dịch vụ.");

        dv.IsActive = false;
        dv.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }
}
