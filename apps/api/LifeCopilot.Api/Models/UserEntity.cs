namespace LifeCopilot.Api.Models;

public class UserEntity
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public long CreatedAt { get; set; }
    public long UpdatedAt { get; set; }
}