namespace Spa.Api.DTOs;

public class LoginRequest
{
    public string DbLoginName { get; set; } = default!;
    public string Password { get; set; } = default!;
}
