namespace LifeCopilot.Api.GoalMilestones;

public sealed class GoalMilestoneEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid GoalId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public int Order { get; set; }
    public string Status { get; set; } = "not_started";

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}