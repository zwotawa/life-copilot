namespace LifeCopilot.Api.Models;

public class DailyRotationItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? GoalId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string ActionText { get; set; } = string.Empty;
    public string? SessionSize { get; set; }
    public bool Completed { get; set; }
    public double? SurfacingScore { get; set; }
    public List<string>? SurfacingReasons { get; set; }
    public string? MilestoneId { get; init; }
    public string? TinyTaskId { get; init; }
}