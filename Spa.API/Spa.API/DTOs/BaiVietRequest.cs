namespace Spa.API.DTOs;

public sealed class BaiVietCreateDto
{
    public string Slug { get; set; } = "";
    public string TieuDe { get; set; } = "";
    public string? MoTaNgan { get; set; }
    public string? NoiDung { get; set; }
    public string? DanhMuc { get; set; }
    public string? AnhBia { get; set; }
    public string? VideoUrl { get; set; }
    public string? TacGia { get; set; }
    public int? ThoiGianDocPhut { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? NgayDang { get; set; }
}

public sealed class BaiVietUpdateDto
{
    public string TieuDe { get; set; } = "";
    public string? MoTaNgan { get; set; }
    public string? NoiDung { get; set; }
    public string? DanhMuc { get; set; }
    public string? AnhBia { get; set; }
    public string? VideoUrl { get; set; }
    public string? TacGia { get; set; }
    public int? ThoiGianDocPhut { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? NgayDang { get; set; }
}
