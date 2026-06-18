namespace Spa.API.DTOs;

public sealed class ChatRequest
{
    public string Message { get; set; } = string.Empty;
}

public sealed class ChatResponse
{
    public string Answer { get; set; } = string.Empty;
}
