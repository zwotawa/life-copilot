namespace LifeCopilot.Api.Surfacing;

public sealed class SurfacingDecisionEventDto
{
    public string Id { get; init; } = string.Empty;
    public string CreatedAt { get; init; } = string.Empty;
    public string Context { get; init; } = string.Empty;
    public string GoalId { get; init; } = string.Empty;
    public string GoalTitle { get; init; } = string.Empty;
    public int Score { get; init; }
    public string? SuggestedCategory { get; init; }
    public List<string> Reasons { get; init; } = new();
    public SurfacingDecisionEventMetadataDto? Metadata { get; init; }
}

public sealed class SurfacingDecisionEventMetadataDto
{
    public string? Date { get; init; }
    public string? ReplacedGoalId { get; init; }
    public string? WeeklyRole { get; init; }
    public bool? Selected { get; init; }
}