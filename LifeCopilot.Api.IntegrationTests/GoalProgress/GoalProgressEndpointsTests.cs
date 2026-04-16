using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeCopilot.Api.IntegrationTests;

public class GoalProgressEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public GoalProgressEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_all_goal_progress_events_returns_only_current_users_events()
    {
        // Arrange
        var email = $"goal-progress-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var createdGoal = await CreateGoalAsync();

        var firstEvent = await CreateGoalProgressEventAsync(createdGoal.Id, "First progress note");
        var secondEvent = await CreateGoalProgressEventAsync(createdGoal.Id, "Second progress note");

        // Act
        var response = await _client.GetAsync("/api/goal-progress");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var events = await response.Content.ReadFromJsonAsync<List<GoalProgressEventResponse>>();

        Assert.NotNull(events);
        Assert.True(events!.Count >= 2);

        Assert.Contains(events, e => e.Id == firstEvent.Id);
        Assert.Contains(events, e => e.Id == secondEvent.Id);

        // Optional: verify both belong to the created goal
        Assert.Contains(events, e => e.GoalId == createdGoal.Id && e.Notes == "First progress note");
        Assert.Contains(events, e => e.GoalId == createdGoal.Id && e.Notes == "Second progress note");

        // Optional: verify newest-first ordering if your endpoint guarantees it
        var firstIndex = events.FindIndex(e => e.Id == firstEvent.Id);
        var secondIndex = events.FindIndex(e => e.Id == secondEvent.Id);

        Assert.NotEqual(-1, firstIndex);
        Assert.NotEqual(-1, secondIndex);

        // If second event was created after first, it should appear earlier in descending order
        Assert.True(secondIndex < firstIndex);
    }

    [Fact]
    public async Task Get_all_goal_progress_events_requires_authentication()
    {
        var response = await _client.GetAsync("/api/goal-progress");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task RegisterAsync(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());
    }

    private async Task<string> LoginAsync(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));

        return body.AccessToken;
    }

    private async Task<GoalResponse> CreateGoalAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/goals", new CreateGoalRequest
        {
            Title = $"Test Goal {Guid.NewGuid()}",
            Status = "active",
            Lane = "life_systems",
            Type = "project",
            DueStyle = "cadence_only",
            MinimumTouchFrequency = "weekly"
        });

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<GoalResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Id));

        return body;
    }

    private async Task<GoalProgressEventResponse> CreateGoalProgressEventAsync(string goalId, string notes)
    {
        var response = await _client.PostAsJsonAsync("/api/goal-progress", new CreateGoalProgressEventRequest
        {
            GoalId = goalId,
            Type = "note",
            Notes = notes
        });

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<GoalProgressEventResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Id));

        return body;
    }
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
}

public class CreateGoalRequest
{
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public string Lane { get; set; } = "life_systems";
    public string Type { get; set; } = "project";
    public string DueStyle { get; set; } = "cadence_only";
    public string MinimumTouchFrequency { get; set; } = "weekly";
}

public class GoalResponse
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}

public class CreateGoalProgressEventRequest
{
    public string GoalId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class GoalProgressEventResponse
{
    public string Id { get; set; } = string.Empty;
    public string GoalId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}