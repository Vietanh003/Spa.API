namespace Spa.API.Services;

public interface IChatService
{
    Task<string> AskAsync(string sessionId, string message, CancellationToken cancellationToken = default);
}
