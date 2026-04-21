namespace LifeCopilot.Api.GoalMilestones;

public sealed class GoalMilestoneDto
{
    public string Id { get; init; } = string.Empty;
    public string GoalId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public int Order { get; init; }
    public string Status { get; init; } = "not_started";
    public string CreatedAt { get; init; } = string.Empty;
    public string? CompletedAt { get; init; }
}