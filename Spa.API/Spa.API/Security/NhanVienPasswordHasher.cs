using System.Security.Cryptography;
using System.Text;
namespace Spa.API.Security;

public static class NhanVienPasswordHasher
{
    public static byte[] CreateSalt() => RandomNumberGenerator.GetBytes(16);

    public static byte[] ComputeHash(byte[] salt, string password)
    {
        var pwBytes = Encoding.Unicode.GetBytes(password ?? string.Empty);

        var data = new byte[salt.Length + pwBytes.Length];
        Buffer.BlockCopy(salt, 0, data, 0, salt.Length);
        Buffer.BlockCopy(pwBytes, 0, data, salt.Length, pwBytes.Length);

        using var sha = SHA256.Create();
        return sha.ComputeHash(data);
    }

    // Constant-time comparison to avoid timing attacks and to avoid depending on
    // System.Security.Cryptography.CryptographicOperations which may conflict
    // with other symbols in the project.
    public static bool VerifyHash(byte[]? a, byte[]? b)
    {
        if (a is null || b is null) return false;
        if (a.Length != b.Length) return false;

        int diff = 0;
        for (int i = 0; i < a.Length; i++)
        {
            diff |= a[i] ^ b[i];
        }

        return diff == 0;
    }
}
