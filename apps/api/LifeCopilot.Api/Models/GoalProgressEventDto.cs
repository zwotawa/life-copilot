namespace LifeCopilot.Api.Models;

public class GoalProgressEventDto
{
    public string Id { get; set; } = string.Empty;
    public string GoalId { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? TaskText { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }
    public string? SourceItemId { get; set; }
    public string? MilestoneId { get; init; }
    public string? MilestoneTitle { get; init; }
    public string? TinyTaskId { get; init; }
    public string? TinyTaskTitle { get; init; }
}