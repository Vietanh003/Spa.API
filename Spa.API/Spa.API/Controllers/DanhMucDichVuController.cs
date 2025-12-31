using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;
using Spa.API.Entities;

[ApiController]
[Route("api/danh-muc-dich-vu")]
public class DanhMucDichVuController : ControllerBase
{
    private readonly AppDbContext _db;
    public DanhMucDichVuController(AppDbContext db) => _db = db;

    // GET: api/danh-muc-dich-vu
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var data = await _db.DanhMucDichVus.AsNoTracking()
            .OrderBy(x => x.ThuTu).ThenBy(x => x.TenDanhMuc)
            .Select(x => new
            {
                x.Id,
                x.MaDanhMuc,
                x.TenDanhMuc,
                x.MoTa,
                x.ThuTu,
                x.IsActive
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/danh-muc-dich-vu/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var dm = await _db.DanhMucDichVus.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.MaDanhMuc,
                x.TenDanhMuc,
                x.MoTa,
                x.ThuTu,
                x.IsActive,
                DichVuCount = x.DichVus.Count
            })
            .FirstOrDefaultAsync();

        if (dm is null) return NotFound("Không tìm thấy danh mục.");
        return Ok(dm);
    }

    // POST: api/danh-muc-dich-vu
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DanhMucDichVuCreateDto dto)
    {
        dto.MaDanhMuc = dto.MaDanhMuc?.Trim() ?? "";
        dto.TenDanhMuc = dto.TenDanhMuc?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(dto.MaDanhMuc) || string.IsNullOrWhiteSpace(dto.TenDanhMuc))
            return BadRequest("MaDanhMuc và TenDanhMuc là bắt buộc.");

        var exists = await _db.DanhMucDichVus.AnyAsync(x => x.MaDanhMuc == dto.MaDanhMuc);
        if (exists) return Conflict("MaDanhMuc đã tồn tại.");

        var dm = new DanhMucDichVu
        {
            MaDanhMuc = dto.MaDanhMuc,
            TenDanhMuc = dto.TenDanhMuc,
            MoTa = dto.MoTa,
            ThuTu = dto.ThuTu,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now
        };

        _db.DanhMucDichVus.Add(dm);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = dm.Id }, new { dm.Id });
    }

    // PUT: api/danh-muc-dich-vu/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] DanhMucDichVuUpdateDto dto)
    {
        dto.TenDanhMuc = dto.TenDanhMuc?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(dto.TenDanhMuc))
            return BadRequest("TenDanhMuc là bắt buộc.");

        var dm = await _db.DanhMucDichVus.FirstOrDefaultAsync(x => x.Id == id);
        if (dm is null) return NotFound("Không tìm thấy danh mục.");

        dm.TenDanhMuc = dto.TenDanhMuc;
        dm.MoTa = dto.MoTa;
        dm.ThuTu = dto.ThuTu;
        dm.IsActive = dto.IsActive;
        dm.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // DELETE (soft): api/danh-muc-dich-vu/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var dm = await _db.DanhMucDichVus
            .Include(x => x.DichVus)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (dm is null) return NotFound("Không tìm thấy danh mục.");

        // Nếu đang có dịch vụ, thường không cho hard-delete
        if (dm.DichVus.Any(x => x.IsActive))
            return BadRequest("Danh mục đang có dịch vụ hoạt động, không thể xóa. Hãy tắt dịch vụ hoặc chuyển danh mục.");

        // Soft delete
        dm.IsActive = false;
        dm.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }
}
