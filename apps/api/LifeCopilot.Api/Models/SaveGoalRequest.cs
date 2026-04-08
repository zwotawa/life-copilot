namespace LifeCopilot.Api.Models;

public class SaveGoalRequest
{
    public string? Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? WhyItMatters { get; set; }

    public string Lane { get; set; } = "custom";
    public string Type { get; set; } = "project";
    public string Status { get; set; } = "active";
    public string? Priority { get; set; }

    public string DueStyle { get; set; } = "cadence_only";
    public string? RealDeadline { get; set; }
    public string? TargetDate { get; set; }
    public string MinimumTouchFrequency { get; set; } = "weekly";

    public string? CurrentMilestone { get; set; }
    public string? NextTinyAction { get; set; }
    public string? TypicalSessionSize { get; set; }

    public string? Energy { get; set; }
    public string? Resistance { get; set; }
    public string? Excitement { get; set; }

    public string? LastTouchedAt { get; set; }
    public string? Notes { get; set; }

    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}