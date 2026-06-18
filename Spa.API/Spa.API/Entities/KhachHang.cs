namespace Spa.API.Entities;

public class KhachHang
{
    public int Id { get; set; }
    public string HoTen { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? GoogleSubject { get; set; }
    public string? AvatarUrl { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
