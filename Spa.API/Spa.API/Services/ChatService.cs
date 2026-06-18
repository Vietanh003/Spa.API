using System.Collections.Concurrent;
using System.Globalization;
using System.Text;

namespace Spa.API.Services;

public sealed class ChatService : IChatService
{
    private const string EmptyAnswer = "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.";
    private const string OutOfDomainAnswer = "Xin lỗi, tôi chỉ hỗ trợ các thông tin liên quan đến dịch vụ và sản phẩm của doanh nghiệp.";
    private static readonly ConcurrentDictionary<string, Queue<ChatMessage>> Histories = new();

    private readonly IChatRepository _repository;
    private readonly IAIService _aiService;
    private readonly ILogger<ChatService> _logger;

    public ChatService(IChatRepository repository, IAIService aiService, ILogger<ChatService> logger)
    {
        _repository = repository;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<string> AskAsync(string sessionId, string message, CancellationToken cancellationToken = default)
    {
        var question = message.Trim();
        var intent = DetectIntent(question);

        _logger.LogInformation("Chat question: {Question}; Intent: {Intent}", question, intent);

        if (intent == ChatIntent.OutOfDomain)
        {
            AddToHistory(sessionId, "user", question);
            AddToHistory(sessionId, "assistant", OutOfDomainAnswer);
            return OutOfDomainAnswer;
        }

        var dbResult = await _repository.GetBusinessContextAsync(intent, question, cancellationToken);
        _logger.LogInformation("Chat retrieval result: {QueryResult}", dbResult.QueryResult);

        var promptContext = BuildPromptContext(sessionId, dbResult.Context);
        _logger.LogInformation("Chat final prompt context: {PromptContext}", promptContext);

        string answer;
        try
        {
            answer = await _aiService.GenerateResponseAsync(question, promptContext);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI response failed. Falling back to retrieved context.");
            answer = BuildFallbackAnswer(dbResult.Context);
        }

        _logger.LogInformation("Chat response: {Answer}", answer);

        AddToHistory(sessionId, "user", question);
        AddToHistory(sessionId, "assistant", answer);

        return answer;
    }

    private static string BuildFallbackAnswer(string databaseContext)
    {
        if (string.IsNullOrWhiteSpace(databaseContext) ||
            databaseContext.Contains("chưa có dữ liệu", StringComparison.OrdinalIgnoreCase))
        {
            return EmptyAnswer;
        }

        var lines = databaseContext
            .Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => x.StartsWith("- "))
            .Take(5)
            .ToArray();

        return lines.Length == 0
            ? EmptyAnswer
            : string.Join(Environment.NewLine, lines);
    }

    private static ChatIntent DetectIntent(string question)
    {
        var q = Normalize(question);

        if (!IsBusinessDomain(q))
        {
            return ChatIntent.OutOfDomain;
        }

        if (HasAny(q, "don hang", "order", "ma don", "trang thai don"))
            return ChatIntent.OrderStatus;

        if (HasAny(q, "dat lich", "lich hen", "booking", "appointment", "hen"))
            return ChatIntent.Booking;

        if (HasAny(q, "khach hang", "thong tin khach", "customer", "email"))
            return ChatIntent.CustomerInformation;

        if (HasAny(q, "con hang", "ton kho", "stock", "inventory"))
            return ChatIntent.ProductStock;

        if (HasAny(q, "san pham", "product"))
        {
            return HasAny(q, "gia", "price", "bao nhieu") ? ChatIntent.ProductPrice : ChatIntent.ProductSearch;
        }

        if (HasAny(q, "khuyen mai", "uu dai", "promotion", "giam gia"))
            return ChatIntent.Promotion;

        if (HasAny(q, "gia", "price", "bao nhieu", "chi phi"))
            return ChatIntent.ServicePrice;

        if (HasAny(q, "dich vu", "spa", "massage", "goi dau", "cham soc", "da", "mun", "nam", "tham", "lao hoa", "lieu trinh", "facial"))
            return ChatIntent.ServiceSearch;

        return ChatIntent.GeneralConsultation;
    }

    private static bool IsBusinessDomain(string q)
    {
        return HasAny(q,
            "dich vu", "spa", "massage", "goi dau", "cham soc", "da", "mun", "nam", "tham",
            "lao hoa", "lieu trinh", "facial", "gia", "san pham", "product", "khuyen mai",
            "uu dai", "khach hang", "don hang", "dat lich", "lich hen", "booking",
            "appointment", "tu van", "con hang", "ton kho", "stock", "inventory");
    }

    private static bool HasAny(string value, params string[] keywords)
    {
        return keywords.Any(value.Contains);
    }

    private static string Normalize(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
    }

    private static string BuildPromptContext(string sessionId, string databaseContext)
    {
        var history = Histories.GetOrAdd(sessionId, _ => new Queue<ChatMessage>());
        string[] historyLines;
        lock (history)
        {
            historyLines = history
                .TakeLast(10)
                .Select(x => $"{x.Role}: {x.Content}")
                .ToArray();
        }

        return $"""
        CHAT HISTORY:
        {string.Join(Environment.NewLine, historyLines)}

        DATABASE_RESULT:
        {databaseContext}
        """;
    }

    private static void AddToHistory(string sessionId, string role, string content)
    {
        var history = Histories.GetOrAdd(sessionId, _ => new Queue<ChatMessage>());
        lock (history)
        {
            history.Enqueue(new ChatMessage(role, content));
            while (history.Count > 10)
            {
                history.Dequeue();
            }
        }
    }

    private sealed record ChatMessage(string Role, string Content);
}
