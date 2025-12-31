using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace Spa.API.Entities
{
    [Table("DanhMucDichVu", Schema = "dbo")]
    public class DanhMucDichVu
    {
        [Key]
        public int Id { get; set; }

        [Required, MaxLength(50)]
        public string MaDanhMuc { get; set; } = null!;

        [Required, MaxLength(200)]
        public string TenDanhMuc { get; set; } = null!;

        [MaxLength(1000)]
        public string? MoTa { get; set; }

        public int ThuTu { get; set; }
        public bool IsActive { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<DichVu> DichVus { get; set; } = new List<DichVu>();
    }
}
