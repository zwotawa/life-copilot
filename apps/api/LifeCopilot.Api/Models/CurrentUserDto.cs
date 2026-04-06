namespace LifeCopilot.Api.Models;

public class CurrentUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool IsAuthenticated { get; set; }
}