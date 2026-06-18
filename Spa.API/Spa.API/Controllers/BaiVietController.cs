using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spa.API.Data;
using Spa.API.DTOs;

namespace Spa.API.Controllers;

[ApiController]
public class BaiVietController : ControllerBase
{
    private readonly AppDbContext _db;
    public BaiVietController(AppDbContext db) => _db = db;

    // ===== PUBLIC =====

    // GET: api/public/blog?q=&danhMuc=&take=
    [HttpGet("api/public/blog")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicList(
        [FromQuery] string? q,
        [FromQuery] string? danhMuc,
        [FromQuery] int take = 50)
    {
        if (take <= 0 || take > 200) return BadRequest("take phải nằm trong 1..200");

        var query = _db.BaiViets.AsNoTracking().Where(x => x.IsPublished);

        if (!string.IsNullOrWhiteSpace(danhMuc))
            query = query.Where(x => x.DanhMuc == danhMuc.Trim());

        if (!string.IsNullOrWhiteSpace(q))
        {
            var k = q.Trim();
            query = query.Where(x =>
                EF.Functions.Like(x.TieuDe, $"%{k}%") ||
                (x.MoTaNgan != null && EF.Functions.Like(x.MoTaNgan, $"%{k}%")));
        }

        var data = await query
            .OrderByDescending(x => x.NgayDang ?? x.CreatedAt)
            .Take(take)
            .Select(x => new
            {
                x.Id,
                x.Slug,
                x.TieuDe,
                x.MoTaNgan,
                x.DanhMuc,
                x.AnhBia,
                x.TacGia,
                x.ThoiGianDocPhut,
                NgayDang = x.NgayDang ?? x.CreatedAt
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/public/blog/{slug}
    [HttpGet("api/public/blog/{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> PublicGet(string slug)
    {
        slug = (slug ?? "").Trim();
        if (string.IsNullOrEmpty(slug)) return BadRequest("Thiếu slug.");

        var item = await _db.BaiViets.AsNoTracking()
            .Where(x => x.Slug == slug && x.IsPublished)
            .Select(x => new
            {
                x.Id,
                x.Slug,
                x.TieuDe,
                x.MoTaNgan,
                x.NoiDung,
                x.DanhMuc,
                x.AnhBia,
                x.VideoUrl,
                x.TacGia,
                x.ThoiGianDocPhut,
                NgayDang = x.NgayDang ?? x.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (item is null) return NotFound();
        return Ok(item);
    }

    // ===== ADMIN =====

    // GET: api/admin/blog?q=&published=&take=
    [HttpGet("api/admin/blog")]
    [Authorize]
    public async Task<IActionResult> AdminList(
        [FromQuery] string? q,
        [FromQuery] bool? published,
        [FromQuery] int take = 200)
    {
        if (take <= 0 || take > 1000) return BadRequest("take phải nằm trong 1..1000");

        var query = _db.BaiViets.AsNoTracking().AsQueryable();
        if (published.HasValue) query = query.Where(x => x.IsPublished == published.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var k = q.Trim();
            query = query.Where(x =>
                EF.Functions.Like(x.TieuDe, $"%{k}%") ||
                EF.Functions.Like(x.Slug, $"%{k}%") ||
                (x.DanhMuc != null && EF.Functions.Like(x.DanhMuc, $"%{k}%")));
        }

        var data = await query
            .OrderByDescending(x => x.Id)
            .Take(take)
            .Select(x => new
            {
                x.Id,
                x.Slug,
                x.TieuDe,
                x.MoTaNgan,
                x.DanhMuc,
                x.AnhBia,
                x.VideoUrl,
                x.TacGia,
                x.ThoiGianDocPhut,
                x.IsPublished,
                x.NgayDang,
                x.CreatedAt,
                x.UpdatedAt,
            })
            .ToListAsync();

        return Ok(data);
    }

    // GET: api/admin/blog/{id}
    [HttpGet("api/admin/blog/{id:int}")]
    [Authorize]
    public async Task<IActionResult> AdminGet(int id)
    {
        var item = await _db.BaiViets.AsNoTracking()
            .Where(x => x.Id == id)
            .FirstOrDefaultAsync();
        if (item is null) return NotFound();
        return Ok(item);
    }

    // POST: api/admin/blog
    [HttpPost("api/admin/blog")]
    [Authorize]
    public async Task<IActionResult> AdminCreate([FromBody] BaiVietCreateDto dto)
    {
        var validate = ValidateBody(dto.TieuDe, dto.Slug, dto.MoTaNgan, dto.NoiDung, dto.DanhMuc,
            dto.AnhBia, dto.VideoUrl, dto.TacGia);
        if (validate is not null) return BadRequest(validate);

        var slug = NormalizeSlug(dto.Slug);
        if (string.IsNullOrEmpty(slug)) return BadRequest("Slug không hợp lệ.");

        var exists = await _db.BaiViets.AnyAsync(x => x.Slug == slug);
        if (exists) return Conflict("Slug đã tồn tại. Vui lòng đổi slug.");

        var entity = new Entities.BaiViet
        {
            Slug = slug,
            TieuDe = dto.TieuDe.Trim(),
            MoTaNgan = NullIfBlank(dto.MoTaNgan),
            NoiDung = dto.NoiDung,
            DanhMuc = NullIfBlank(dto.DanhMuc),
            AnhBia = NullIfBlank(dto.AnhBia),
            VideoUrl = NullIfBlank(dto.VideoUrl),
            TacGia = NullIfBlank(dto.TacGia),
            ThoiGianDocPhut = dto.ThoiGianDocPhut,
            IsPublished = dto.IsPublished,
            NgayDang = dto.IsPublished ? (dto.NgayDang ?? DateTime.Now) : dto.NgayDang,
            CreatedAt = DateTime.Now,
            CreatedBy = User.Identity?.Name,
        };

        _db.BaiViets.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(new { id = entity.Id, slug = entity.Slug });
    }

    // PUT: api/admin/blog/{id}
    [HttpPut("api/admin/blog/{id:int}")]
    [Authorize]
    public async Task<IActionResult> AdminUpdate(int id, [FromBody] BaiVietUpdateDto dto)
    {
        var item = await _db.BaiViets.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();

        var validate = ValidateBody(dto.TieuDe, item.Slug, dto.MoTaNgan, dto.NoiDung, dto.DanhMuc,
            dto.AnhBia, dto.VideoUrl, dto.TacGia);
        if (validate is not null) return BadRequest(validate);

        item.TieuDe = dto.TieuDe.Trim();
        item.MoTaNgan = NullIfBlank(dto.MoTaNgan);
        item.NoiDung = dto.NoiDung;
        item.DanhMuc = NullIfBlank(dto.DanhMuc);
        item.AnhBia = NullIfBlank(dto.AnhBia);
        item.VideoUrl = NullIfBlank(dto.VideoUrl);
        item.TacGia = NullIfBlank(dto.TacGia);
        item.ThoiGianDocPhut = dto.ThoiGianDocPhut;

        // chuyển từ chưa publish → publish thì set NgayDang nếu thiếu
        if (dto.IsPublished && !item.IsPublished && !dto.NgayDang.HasValue)
            item.NgayDang = DateTime.Now;
        else if (dto.NgayDang.HasValue)
            item.NgayDang = dto.NgayDang;

        item.IsPublished = dto.IsPublished;
        item.UpdatedAt = DateTime.Now;
        item.UpdatedBy = User.Identity?.Name;

        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // DELETE: api/admin/blog/{id}
    [HttpDelete("api/admin/blog/{id:int}")]
    [Authorize]
    public async Task<IActionResult> AdminDelete(int id)
    {
        var item = await _db.BaiViets.FirstOrDefaultAsync(x => x.Id == id);
        if (item is null) return NotFound();
        _db.BaiViets.Remove(item);
        await _db.SaveChangesAsync();
        return Ok(new { message = "OK" });
    }

    // ===== helpers =====

    private static string? ValidateBody(
        string? tieuDe, string? slug,
        string? moTaNgan, string? noiDung, string? danhMuc,
        string? anhBia, string? videoUrl, string? tacGia)
    {
        if (string.IsNullOrWhiteSpace(tieuDe)) return "Tiêu đề là bắt buộc.";
        if (tieuDe.Length > 250) return "Tiêu đề quá dài (<= 250 ký tự).";
        if (string.IsNullOrWhiteSpace(slug)) return "Slug là bắt buộc.";
        if (slug.Length > 250) return "Slug quá dài (<= 250 ký tự).";
        if (!string.IsNullOrEmpty(moTaNgan) && moTaNgan.Length > 500) return "Mô tả ngắn quá dài (<= 500).";
        if (!string.IsNullOrEmpty(danhMuc) && danhMuc.Length > 100) return "Danh mục quá dài (<= 100).";
        if (!string.IsNullOrEmpty(anhBia) && anhBia.Length > 500) return "Ảnh bìa quá dài (<= 500).";
        if (!string.IsNullOrEmpty(videoUrl) && videoUrl.Length > 500) return "Video URL quá dài (<= 500).";
        if (!string.IsNullOrEmpty(tacGia) && tacGia.Length > 100) return "Tác giả quá dài (<= 100).";
        // noiDung không giới hạn (nvarchar(max))
        _ = noiDung;
        return null;
    }

    private static string NormalizeSlug(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "";
        var s = raw.Trim().ToLowerInvariant();
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var c in s)
        {
            if (char.IsLetterOrDigit(c) || c == '-' || c == '_') sb.Append(c);
            else if (c == ' ') sb.Append('-');
        }
        return sb.ToString();
    }

    private static string? NullIfBlank(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();
}
