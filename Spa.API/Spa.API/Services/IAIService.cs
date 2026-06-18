namespace Spa.API.Services;

public interface IAIService
{
    Task<string> GenerateResponseAsync(string question, string context);
}
