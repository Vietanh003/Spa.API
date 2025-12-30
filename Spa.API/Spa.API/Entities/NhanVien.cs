namespace Spa.API.Entities
{
    public class NhanVien
    {
        public int Id { get; set; }
        public string HoTen { get; set; } = default!;
        public string GioiTinh { get; set; } = default!;
        public string DienThoai { get; set; } = default!;
        public string? DiaChi { get; set; }
        public string ChucVu { get; set; } = "Owner";
        public string DbLoginName { get; set; } = default!;
        public bool IsActive { get; set; } = true;
        public string? PasswordHash { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
