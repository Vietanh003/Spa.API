namespace Spa.API.Entities
{
    public class NhanVien
    {
        public int Id { get; set; }
        public string HoTen { get; set; } = null!;
        public string GioiTinh { get; set; } = null!;
        public string DienThoai { get; set; } = null!;
        public string? DiaChi { get; set; }
        public string ChucVu { get; set; } = null!;
        public string DbLoginName { get; set; } = null!;
        public bool IsActive { get; set; }

        public byte[]? PasswordSalt { get; set; }   
        public byte[]? PasswordHashSha { get; set; }   

        public string? PasswordHash { get; set; }        // nvarchar(200) - không dùng nữa
        public string? PasswordPlain { get; set; }       // nvarchar(200) - trigger sẽ null lại
    }

}
