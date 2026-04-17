namespace LifeCopilot.Api.Surfacing;

public sealed class SurfacingDecisionEventEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Context { get; set; } = string.Empty;
    public Guid GoalId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;

    public int Score { get; set; }
    public string? SuggestedCategory { get; set; }

    public string ReasonsJson { get; set; } = "[]";
    public string? MetadataJson { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}