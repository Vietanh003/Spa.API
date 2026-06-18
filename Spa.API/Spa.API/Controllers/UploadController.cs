using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Spa.API.Security;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/admin/upload")]
[Authorize(Roles = AppRoles.Admin + "," + AppRoles.ContentManager + "," + AppRoles.ServiceManager)]
public class UploadController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageExt = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    private static readonly HashSet<string> AllowedVideoExt = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".webm", ".mov", ".m4v"
    };

    private const long MaxImageSize = 5 * 1024 * 1024;       // 5 MB
    private const long MaxVideoSize = 100 * 1024 * 1024;     // 100 MB

    private readonly Cloudinary? _cloudinary;
    private readonly IWebHostEnvironment _env;

    public UploadController(IServiceProvider services, IWebHostEnvironment env)
    {
        _cloudinary = services.GetService<Cloudinary>();
        _env = env;
    }

    public class UploadResult
    {
        public string Url { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long Size { get; set; }
        public string Kind { get; set; } = "image";
        public string? PublicId { get; set; }
    }

    [HttpPost("image")]
    [RequestSizeLimit(MaxImageSize)]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromQuery] string? folder)
    {
        if (file == null || file.Length == 0) return BadRequest("Chưa chọn file.");
        if (file.Length > MaxImageSize) return BadRequest("File quá lớn (tối đa 5MB).");

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedImageExt.Contains(ext))
            return BadRequest("Định dạng file không hỗ trợ. Cho phép: jpg, jpeg, png, webp, gif.");

        var safeFolder = SanitizeFolder(folder) ?? "dich-vu";
        if (_cloudinary == null)
            return await SaveLocalAsync(file, safeFolder, "image");

        await using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"spa/{safeFolder}",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        if (result.Error != null) return StatusCode(502, $"Upload Cloudinary thất bại: {result.Error.Message}");

        return Ok(new UploadResult
        {
            Url = result.SecureUrl?.AbsoluteUri ?? result.Url?.AbsoluteUri ?? "",
            FileName = result.OriginalFilename ?? file.FileName,
            Size = file.Length,
            Kind = "image",
            PublicId = result.PublicId,
        });
    }

    [HttpPost("video")]
    [RequestSizeLimit(MaxVideoSize)]
    public async Task<IActionResult> UploadVideo([FromForm] IFormFile file, [FromQuery] string? folder)
    {
        if (file == null || file.Length == 0) return BadRequest("Chưa chọn file.");
        if (file.Length > MaxVideoSize) return BadRequest("File quá lớn (tối đa 100MB).");

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !AllowedVideoExt.Contains(ext))
            return BadRequest("Định dạng file không hỗ trợ. Cho phép: mp4, webm, mov, m4v.");

        var safeFolder = SanitizeFolder(folder) ?? "blog";
        if (_cloudinary == null)
            return await SaveLocalAsync(file, safeFolder, "video");

        await using var stream = file.OpenReadStream();

        var uploadParams = new VideoUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = $"spa/{safeFolder}",
            UseFilename = false,
            UniqueFilename = true,
            Overwrite = false,
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        if (result.Error != null) return StatusCode(502, $"Upload Cloudinary thất bại: {result.Error.Message}");

        return Ok(new UploadResult
        {
            Url = result.SecureUrl?.AbsoluteUri ?? result.Url?.AbsoluteUri ?? "",
            FileName = result.OriginalFilename ?? file.FileName,
            Size = file.Length,
            Kind = "video",
            PublicId = result.PublicId,
        });
    }

    private static string? SanitizeFolder(string? folder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return null;
        var s = folder.Trim().ToLowerInvariant();
        var clean = new string(s.Where(c => char.IsLetterOrDigit(c) || c == '-' || c == '_').ToArray());
        return string.IsNullOrEmpty(clean) ? null : clean;
    }

    private async Task<IActionResult> SaveLocalAsync(IFormFile file, string folder, string kind)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}{ext}";
        var uploadDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", folder);
        Directory.CreateDirectory(uploadDir);

        var filePath = Path.Combine(uploadDir, fileName);
        await using (var output = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(output);
        }

        var pathBase = Request.PathBase.HasValue ? Request.PathBase.Value : "";
        var url = $"{Request.Scheme}://{Request.Host}{pathBase}/uploads/{folder}/{fileName}";

        return Ok(new UploadResult
        {
            Url = url,
            FileName = file.FileName,
            Size = file.Length,
            Kind = kind,
            PublicId = $"local/uploads/{folder}/{fileName}",
        });
    }
}
