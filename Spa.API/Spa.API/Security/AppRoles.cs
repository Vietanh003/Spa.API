namespace Spa.API.Security;

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string ContentManager = "ContentManager";
    public const string ServiceManager = "ServiceManager";
    public const string Receptionist = "Receptionist";
    public const string Customer = "Customer";

    public static readonly string[] Supported =
    [
        Admin,
        ContentManager,
        ServiceManager,
        Receptionist,
        Customer,
    ];

    public static bool IsSupported(string? role)
    {
        if (string.IsNullOrWhiteSpace(role)) return false;

        return Supported.Any(x => string.Equals(x, role.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}
