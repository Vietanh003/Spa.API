using Microsoft.AspNetCore.Mvc;
using Spa.API.DTOs;
using Spa.API.Services;

namespace Spa.API.Controllers;

[ApiController]
[Route("api/chat")]
public sealed class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(IChatService chatService, ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ChatResponse>> Post([FromBody] ChatRequest request, CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Message is required." });
        }

        try
        {
            var sessionId = Request.Headers.TryGetValue("x-chat-session-id", out var value)
                ? value.ToString()
                : HttpContext.TraceIdentifier;

            var answer = await _chatService.AskAsync(sessionId, request.Message, cancellationToken);
            return Ok(new ChatResponse { Answer = answer });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Chat request failed.");
            return StatusCode(StatusCodes.Status500InternalServerError, new ChatResponse
            {
                Answer = "Hiện tôi chưa có dữ liệu để trả lời câu hỏi này."
            });
        }
    }
}
