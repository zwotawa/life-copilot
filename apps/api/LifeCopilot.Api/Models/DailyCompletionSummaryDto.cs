namespace LifeCopilot.Api.Models;

public class DailyCompletionSummaryDto
{
    public string Date { get; set; } = string.Empty;
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
    public int CompletionPercent { get; set; }
    public bool FullyCompleted { get; set; }
}