using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Spa.API.Entities;

[Table("LienHe")]
public class LienHe
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string HoTen { get; set; } = null!;

    [Required, MaxLength(20)]
    public string DienThoai { get; set; } = null!;

    [MaxLength(100)]
    public string? Email { get; set; }

    [Required, MaxLength(2000)]
    public string LoiNhan { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public bool DaXem { get; set; }

    public DateTime? XemLuc { get; set; }

    [MaxLength(128)]
    public string? XemBoi { get; set; }
}
