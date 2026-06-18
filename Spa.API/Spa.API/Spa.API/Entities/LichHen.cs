using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Spa.API.Entities;

[Table("LichHen")]
public class LichHen
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string HoTenKhach { get; set; } = null!;

    [Required, MaxLength(20)]
    public string DienThoaiKhach { get; set; } = null!;

    [MaxLength(100)]
    public string? EmailKhach { get; set; }

    public int? KhachHangId { get; set; }
    public KhachHang? KhachHang { get; set; }

    public DateOnly NgayHen { get; set; }
    public TimeOnly GioHen { get; set; }

    public int ThoiLuongDuKien { get; set; }

    public int? NhanVienId { get; set; }

    public int DichVuId { get; set; }
    public DichVu? DichVu { get; set; }

    [MaxLength(500)]
    public string? GhiChuKhach { get; set; }

    [MaxLength(1000)]
    public string? GhiChuNoiBo { get; set; }

    [Required, MaxLength(50)]
    public string TrangThai { get; set; } = "Chờ xác nhận";

    [MaxLength(500)]
    public string? LyDoHuy { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    [MaxLength(128)]
    public string? CreatedBy { get; set; }

    [MaxLength(128)]
    public string? UpdatedBy { get; set; }

    public bool DaDen { get; set; }
}
