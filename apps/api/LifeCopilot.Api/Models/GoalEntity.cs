namespace LifeCopilot.Api.Models;

public class GoalEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    public string Lane { get; set; } = "custom";
    public string Type { get; set; } = "project";
    public string Status { get; set; } = "active";

    public string? DueStyle { get; set; }
    public string? TouchFrequency { get; set; }
    public string? SessionSize { get; set; }
    public string? EnergyLevel { get; set; }

    public long CreatedAt { get; set; }
    public long UpdatedAt { get; set; }
    public long? LastTouchedAt { get; set; }
}