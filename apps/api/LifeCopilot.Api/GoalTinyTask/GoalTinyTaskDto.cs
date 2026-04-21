namespace LifeCopilot.Api.GoalTinyTasks;

public sealed class GoalTinyTaskDto
{
    public string Id { get; init; } = string.Empty;
    public string GoalId { get; init; } = string.Empty;
    public string MilestoneId { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public int Order { get; init; }
    public string Status { get; init; } = "not_started";
    public string CreatedAt { get; init; } = string.Empty;
    public string? CompletedAt { get; init; }
}