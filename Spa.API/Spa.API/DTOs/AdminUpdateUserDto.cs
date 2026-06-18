namespace Spa.API.DTOs;

public sealed class AdminUpdateUserDto
{
    public string HoTen { get; set; } = "";
    public string GioiTinh { get; set; } = "Khac";
    public string DienThoai { get; set; } = "";
    public string? DiaChi { get; set; }
    public string ChucVu { get; set; } = "";
    public bool IsActive { get; set; } = true;
}
