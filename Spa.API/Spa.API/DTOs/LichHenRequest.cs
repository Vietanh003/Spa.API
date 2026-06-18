namespace Spa.API.DTOs;

public sealed class LichHenCreateDto
{
    public string HoTenKhach { get; set; } = "";
    public string DienThoaiKhach { get; set; } = "";
    public string? EmailKhach { get; set; }

    public DateOnly NgayHen { get; set; }
    public TimeOnly GioHen { get; set; }

    public int DichVuId { get; set; }

    public int? ThoiLuongDuKien { get; set; }

    public string? GhiChuKhach { get; set; }
}

public sealed class LichHenConfirmDto
{
    public int? NhanVienId { get; set; }
    public string? GhiChuNoiBo { get; set; }
}
