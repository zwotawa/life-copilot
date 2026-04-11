namespace LifeCopilot.Api.Models;

public class GoalProgressEventEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string GoalId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? TaskText { get; set; }
    public string? Notes { get; set; }

    public string? Source { get; set; }
    public string? SourceItemId { get; set; }
}