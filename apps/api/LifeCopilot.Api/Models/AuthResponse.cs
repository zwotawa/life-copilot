namespace LifeCopilot.Api.Models;

public class AuthResponse
{
    public CurrentUserDto User { get; set; } = new();
    public string AccessToken { get; set; } = string.Empty;
}