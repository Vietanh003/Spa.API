namespace Spa.API.DTOs;

public sealed class LichHenAvailabilityDayDto
{
    public DateOnly Date { get; init; }
    public IReadOnlyList<TimeOnly> Slots { get; init; } = Array.Empty<TimeOnly>();
}
