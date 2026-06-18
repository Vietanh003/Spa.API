namespace Spa.API.DTOs;

public sealed class CustomerGoogleLoginDto
{
    public string IdToken { get; set; } = "";
    public string Credential { get; set; } = "";
}

public sealed class CustomerSendEmailCodeDto
{
    public string Email { get; set; } = "";
}

public sealed class CustomerVerifyEmailCodeDto
{
    public string Email { get; set; } = "";
    public string Code { get; set; } = "";
}
