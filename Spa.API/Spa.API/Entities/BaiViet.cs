using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Spa.API.Entities;

[Table("BaiViet")]
public class BaiViet
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(250)]
    public string Slug { get; set; } = null!;

    [Required, MaxLength(250)]
    public string TieuDe { get; set; } = null!;

    [MaxLength(500)]
    public string? MoTaNgan { get; set; }

    // Nội dung dạng text dài / HTML / markdown
    public string? NoiDung { get; set; }

    [MaxLength(100)]
    public string? DanhMuc { get; set; }

    [MaxLength(500)]
    public string? AnhBia { get; set; }

    [MaxLength(500)]
    public string? VideoUrl { get; set; }

    [MaxLength(100)]
    public string? TacGia { get; set; }

    public int? ThoiGianDocPhut { get; set; }

    public bool IsPublished { get; set; }

    public DateTime? NgayDang { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(128)]
    public string? CreatedBy { get; set; }

    [MaxLength(128)]
    public string? UpdatedBy { get; set; }
}
