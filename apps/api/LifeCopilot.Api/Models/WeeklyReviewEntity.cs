namespace LifeCopilot.Api.Models;

public class WeeklyReviewEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string WeekStartDate { get; set; } = string.Empty;

    public string AnchorGoalIdsJson { get; set; } = "[]";
    public string? InfrastructureGoalId { get; set; }
    public string MaintenanceGoalIdsJson { get; set; } = "[]";
    public string? CreativeGoalId { get; set; }

    public string Notes { get; set; } = string.Empty;

    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}