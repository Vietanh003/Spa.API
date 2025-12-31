namespace Spa.API.DTOs
{
    public class DanhMucDichVuCreateDto
    {
        public string MaDanhMuc { get; set; } = default!;
        public string TenDanhMuc { get; set; } = default!;
        public string? MoTa { get; set; }
        public int ThuTu { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class DanhMucDichVuUpdateDto
    {
        public string TenDanhMuc { get; set; } = default!;
        public string? MoTa { get; set; }
        public int ThuTu { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }
}
