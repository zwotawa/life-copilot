public class DailyCompletionSummaryEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Date { get; set; } = string.Empty;
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
    public int CompletionPercent { get; set; }
    public bool FullyCompleted { get; set; }
    public string UpdatedAt { get; set; } = string.Empty;
}