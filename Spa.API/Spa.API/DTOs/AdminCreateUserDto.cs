namespace Spa.API.DTOs;

public sealed class AdminCreateUserDto
{
    public string HoTen { get; set; } = "";
    public string GioiTinh { get; set; } = "Khác";
    public string DienThoai { get; set; } = "";
    public string? DiaChi { get; set; }
    public string DbLoginName { get; set; } = "";
    public string Password { get; set; } = "";
    public string ChucVu { get; set; } = "";
    public bool IsActive { get; set; } = true;
}
