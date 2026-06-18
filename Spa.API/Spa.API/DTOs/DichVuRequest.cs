namespace Spa.API.DTOs
{
    public class DichVuCreateDto
    {
        public int? DanhMucId { get; set; }
        public string MaDichVu { get; set; } = default!;
        public string TenDichVu { get; set; } = default!;
        public string? MoTaNgan { get; set; }
        public string? MoTa { get; set; }
        public string? LieuTrinh { get; set; }

        public decimal GiaHienTai { get; set; }
        public decimal? GiaGoc { get; set; }
        public decimal? PhanTramGiam { get; set; }
        public DateTime? ApDungTu { get; set; }
        public DateTime? ApDungDen { get; set; }

        public int ThoiLuongPhut { get; set; }
        public int? SoBuoi { get; set; }
        public int? ThoiGianHieuLucNgay { get; set; }

        public string? SKU { get; set; }
        public string? Barcode { get; set; }

        public bool IsCombo { get; set; } = false;
        public bool IsOnlineVisible { get; set; } = true;
        public bool IsActive { get; set; } = true;
        public int ThuTuHienThi { get; set; } = 0;

        public string? HinhAnhChinh { get; set; }
        public string? HinhAnhJson { get; set; }

        public string? Slug { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
    }

    public class DichVuUpdateDto
    {
        public int? DanhMucId { get; set; }
        public string TenDichVu { get; set; } = default!;
        public string? MoTaNgan { get; set; }
        public string? MoTa { get; set; }
        public string? LieuTrinh { get; set; }

        public decimal GiaHienTai { get; set; }
        public decimal? GiaGoc { get; set; }
        public decimal? PhanTramGiam { get; set; }
        public DateTime? ApDungTu { get; set; }
        public DateTime? ApDungDen { get; set; }

        public int ThoiLuongPhut { get; set; }
        public int? SoBuoi { get; set; }
        public int? ThoiGianHieuLucNgay { get; set; }

        public string? SKU { get; set; }
        public string? Barcode { get; set; }

        public bool IsCombo { get; set; }
        public bool IsOnlineVisible { get; set; }
        public bool IsActive { get; set; }
        public int ThuTuHienThi { get; set; }

        public string? HinhAnhChinh { get; set; }
        public string? HinhAnhJson { get; set; }

        public string? Slug { get; set; }
        public string? MetaTitle { get; set; }
        public string? MetaDescription { get; set; }
    }

}
