using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Spa.API.Entities
{
    [Table("DichVu", Schema = "dbo")]
    public class DichVu
    {
        [Key]
        public int Id { get; set; }

        // FK danh mục (nullable vì SQL đang cho NULL)
        public int? DanhMucId { get; set; }
        public DanhMucDichVu? DanhMucDichVu { get; set; }


        [Required, MaxLength(50)]
        public string MaDichVu { get; set; } = null!;

        [Required, MaxLength(200)]
        public string TenDichVu { get; set; } = null!;

        [MaxLength(500)]
        public string? MoTaNgan { get; set; }

        public string? MoTa { get; set; }          // NVARCHAR(MAX)
        public string? LieuTrinh { get; set; }     // NVARCHAR(MAX)

        [MaxLength(1000)]
        public string? GhiChuNoiBo { get; set; }

        // Giá
        [Column(TypeName = "decimal(18,2)")]
        public decimal GiaHienTai { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? GiaGoc { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? PhanTramGiam { get; set; }

        public DateTime? ApDungTu { get; set; }
        public DateTime? ApDungDen { get; set; }

        // Thời lượng / gói
        public int ThoiLuongPhut { get; set; }
        public int? SoBuoi { get; set; }
        public int? ThoiGianHieuLucNgay { get; set; }

        // Bán hàng / vận hành
        [MaxLength(50)]
        public string? SKU { get; set; }

        [MaxLength(50)]
        public string? Barcode { get; set; }

        public bool IsCombo { get; set; }
        public bool IsOnlineVisible { get; set; }
        public bool IsActive { get; set; }
        public int ThuTuHienThi { get; set; }

        // Hình ảnh
        [MaxLength(500)]
        public string? HinhAnhChinh { get; set; }

        public string? HinhAnhJson { get; set; }   // NVARCHAR(MAX) chứa JSON

        // SEO
        [MaxLength(250)]
        public string? Slug { get; set; }

        [MaxLength(250)]
        public string? MetaTitle { get; set; }

        [MaxLength(500)]
        public string? MetaDescription { get; set; }

        // Audit
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        [MaxLength(128)]
        public string? CreatedBy { get; set; }

        [MaxLength(128)]
        public string? UpdatedBy { get; set; }
    }
}
