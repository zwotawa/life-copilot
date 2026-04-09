namespace LifeCopilot.Api.Models;

public class WeeklyReviewDto
{
    public string Id { get; set; } = string.Empty;
    public string WeekStartDate { get; set; } = string.Empty;
    public List<string> AnchorGoalIds { get; set; } = [];
    public string? InfrastructureGoalId { get; set; }
    public List<string> MaintenanceGoalIds { get; set; } = [];
    public string? CreativeGoalId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}