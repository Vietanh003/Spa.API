namespace Spa.Api.DTOs;

public class AuthLoginDto
{
    public string DbLoginName { get; set; } = default!;
    public string Password { get; set; } = default!;
}
