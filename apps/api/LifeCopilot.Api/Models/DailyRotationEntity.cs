namespace LifeCopilot.Api.Models;

public class DailyRotationEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Date { get; set; } = string.Empty;
    public string ItemsJson { get; set; } = "[]";

    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}