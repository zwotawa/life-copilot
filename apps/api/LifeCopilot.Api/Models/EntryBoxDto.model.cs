namespace LifeCopilot.Api.Models;

public class InboxEntryDto
{
    public string Id { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string Status { get; set; } = "new";
    public string? Notes { get; set; }
    public string? LinkedGoalId { get; set; }
    public string CapturedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
    public string? CompletedAt { get; set; }
}