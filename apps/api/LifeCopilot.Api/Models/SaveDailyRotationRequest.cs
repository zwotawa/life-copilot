namespace LifeCopilot.Api.Models;

public class SaveDailyRotationRequest
{
    public string Date { get; set; } = string.Empty;
    public List<DailyRotationItemDto> Items { get; set; } = [];
}