namespace Spa.API.Services;

public sealed record ChatRepositoryResult(string Context, string QueryResult);

public interface IChatRepository
{
    Task<ChatRepositoryResult> GetBusinessContextAsync(ChatIntent intent, string question, CancellationToken cancellationToken = default);
}
