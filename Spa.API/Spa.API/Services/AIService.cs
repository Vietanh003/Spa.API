using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Spa.API.Services;

public sealed class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIService> _logger;

    public AIService(HttpClient httpClient, IConfiguration configuration, ILogger<AIService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateResponseAsync(string question, string context)
    {
        var provider = _configuration["Ai:Provider"] ?? "Gemini";

        if (provider.Equals("Local", StringComparison.OrdinalIgnoreCase))
        {
            return GenerateLocalResponse(question, context);
        }

        var apiKey = _configuration["Ai:ApiKey"] ?? Environment.GetEnvironmentVariable("AI_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("AI API key is missing. Configure Ai:ApiKey or AI_API_KEY.");
            return "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.";
        }

        if (provider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
        {
            return await GenerateOpenAiResponseAsync(apiKey, question, context);
        }

        return await GenerateGeminiResponseAsync(apiKey, question, context);
    }

    private async Task<string> GenerateGeminiResponseAsync(string apiKey, string question, string context)
    {
        var model = _configuration["Ai:GeminiModel"] ?? _configuration["Ai:Model"] ?? "gemini-1.5-flash";
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{Uri.EscapeDataString(model)}:generateContent?key={Uri.EscapeDataString(apiKey)}";

        var payload = new
        {
            systemInstruction = new
            {
                parts = new[] { new { text = BuildSystemPrompt() } }
            },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[] { new { text = $"CONTEXT:\n{context}\n\nCUSTOMER QUESTION:\n{question}" } }
                }
            },
            generationConfig = new
            {
                temperature = 0.2,
                maxOutputTokens = 512
            }
        };

        using var response = await SendWithRetryAsync(url, payload);

        using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return string.IsNullOrWhiteSpace(text)
            ? "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này."
            : text.Trim();
    }

    private async Task<HttpResponseMessage> SendWithRetryAsync(string url, object payload)
    {
        const int maxAttempts = 3;
        var json = JsonSerializer.Serialize(payload);

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var response = await _httpClient.PostAsync(
                url,
                new StringContent(json, Encoding.UTF8, "application/json"));

            if (response.IsSuccessStatusCode)
            {
                return response;
            }

            var shouldRetry =
                response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable ||
                response.StatusCode == System.Net.HttpStatusCode.TooManyRequests;

            if (shouldRetry && attempt < maxAttempts)
            {
                _logger.LogWarning(
                    "Gemini request failed with {StatusCode}. Retrying attempt {Attempt}/{MaxAttempts}.",
                    (int)response.StatusCode,
                    attempt + 1,
                    maxAttempts);

                response.Dispose();
                await Task.Delay(TimeSpan.FromSeconds(attempt * 2));
                continue;
            }

            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gemini request failed with {StatusCode}: {Body}", (int)response.StatusCode, body);
            response.EnsureSuccessStatusCode();
            return response;
        }

        throw new InvalidOperationException("Gemini request failed.");
    }

    private async Task<string> GenerateOpenAiResponseAsync(string apiKey, string question, string context)
    {
        var model = _configuration["Ai:OpenAIModel"] ?? _configuration["Ai:Model"] ?? "gpt-4o-mini";
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var payload = new
        {
            model,
            temperature = 0.2,
            max_tokens = 512,
            messages = new object[]
            {
                new { role = "system", content = BuildSystemPrompt() },
                new { role = "user", content = $"CONTEXT:\n{context}\n\nCUSTOMER QUESTION:\n{question}" }
            }
        };

        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return string.IsNullOrWhiteSpace(text)
            ? "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này."
            : text.Trim();
    }

    private static string BuildSystemPrompt()
    {
        return """
        You are a customer support assistant.

        Only answer using the provided business information.

        Never invent products, prices, inventory, promotions, bookings, or order information.

        If information is missing, respond:

        "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này."

        Keep responses concise, professional, and customer-friendly.
        """;
    }

    private static string GenerateLocalResponse(string question, string context)
    {
        var lines = context
            .Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(x => x.StartsWith("- "))
            .Take(5)
            .ToArray();

        if (lines.Length == 0)
        {
            return "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này.";
        }

        var lowerQuestion = question.ToLowerInvariant();
        var prefix =
            lowerQuestion.Contains("giá") || lowerQuestion.Contains("gia") || lowerQuestion.Contains("bao nhiêu")
                ? "Thông tin giá/dịch vụ hiện có:"
                : "Thông tin phù hợp hiện có:";

        return prefix + Environment.NewLine + string.Join(Environment.NewLine, lines);
    }
}
