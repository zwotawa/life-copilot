namespace LifeCopilot.Api.Models;

public class GoalDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Lane { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? DueStyle { get; set; }
    public string? TouchFrequency { get; set; }
    public string? SessionSize { get; set; }
    public string? EnergyLevel { get; set; }
    public long CreatedAt { get; set; }
    public long UpdatedAt { get; set; }
    public long? LastTouchedAt { get; set; }


}