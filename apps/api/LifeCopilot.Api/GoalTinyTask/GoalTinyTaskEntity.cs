namespace LifeCopilot.Api.GoalTinyTasks;

public sealed class GoalTinyTaskEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public Guid GoalId { get; set; }
    public Guid MilestoneId { get; set; }

    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public string Status { get; set; } = "not_started";

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}