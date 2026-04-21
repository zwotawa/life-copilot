
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace LifeCopilot.Api.IntegrationTests.GoalMilestone;

public class GoalMilestoneEndpointsTests: IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public GoalMilestoneEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_milestone_returns_created_milestone()
    {
        // Arrange
        var email = $"milestones-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();

        var request = new GoalMilestoneDto
        {
            Id = Guid.NewGuid().ToString(),
            GoalId = goal.Id,
            Title = "Finish first draft",
            Notes = "Get the first working version done",
            Order = 0,
            Status = "active",
            CreatedAt = DateTime.UtcNow.ToString("O"),
            CompletedAt = null
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/goal-milestones", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<GoalMilestoneDto>();

        Assert.NotNull(body);
        Assert.Equal(goal.Id, body!.GoalId);
        Assert.Equal("Finish first draft", body.Title);
        Assert.Equal("active", body.Status);
        Assert.Equal(0, body.Order);
    }

    [Fact]
    public async Task Get_milestones_for_goal_returns_milestones_in_order()
    {
        // Arrange
        var email = $"milestones-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();

        var milestoneA = await CreateMilestoneAsync(goal.Id, "Milestone A", 0, "not_started");
        var milestoneB = await CreateMilestoneAsync(goal.Id, "Milestone B", 1, "active");

        // Act
        var response = await _client.GetAsync($"/api/goal-milestones/goal/{goal.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var milestones = await response.Content.ReadFromJsonAsync<List<GoalMilestoneDto>>();

        Assert.NotNull(milestones);
        Assert.Equal(2, milestones!.Count);

        Assert.Equal("Milestone A", milestones[0].Title);
        Assert.Equal("Milestone B", milestones[1].Title);
    }

    [Fact]
    public async Task Update_milestone_updates_title_status_and_order()
    {
        // Arrange
        var email = $"milestones-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();
        var milestone = await CreateMilestoneAsync(goal.Id, "Old title", 0, "not_started");

        var updateRequest = new GoalMilestoneDto
        {
            Id = milestone.Id,
            GoalId = goal.Id,
            Title = "Updated title",
            Notes = "Now completed",
            Order = 2,
            Status = "completed",
            CreatedAt = milestone.CreatedAt,
            CompletedAt = DateTime.UtcNow.ToString("O")
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/goal-milestones/{milestone.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<GoalMilestoneDto>();

        Assert.NotNull(updated);
        Assert.Equal("Updated title", updated!.Title);
        Assert.Equal("completed", updated.Status);
        Assert.Equal(2, updated.Order);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task Delete_milestone_removes_it()
    {
        // Arrange
        var email = $"milestones-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();
        var milestone = await CreateMilestoneAsync(goal.Id, "Delete me", 0, "not_started");

        // Act
        var deleteResponse = await _client.DeleteAsync($"/api/goal-milestones/{milestone.Id}");

        // Assert delete
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Assert it is gone
        var getResponse = await _client.GetAsync($"/api/goal-milestones/goal/{goal.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var milestones = await getResponse.Content.ReadFromJsonAsync<List<GoalMilestoneDto>>();
        Assert.NotNull(milestones);
        Assert.DoesNotContain(milestones!, m => m.Id == milestone.Id);
    }

    [Fact]
    public async Task Reorder_milestones_updates_order_values()
    {
        // Arrange
        var email = $"milestones-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();

        var first = await CreateMilestoneAsync(goal.Id, "First", 0, "not_started");
        var second = await CreateMilestoneAsync(goal.Id, "Second", 1, "active");

        var reordered = new List<GoalMilestoneDto>
        {
            new GoalMilestoneDto
            {
                Id = second.Id,
                GoalId = goal.Id,
                Title = second.Title,
                Notes = second.Notes,
                Order = 0,
                Status = second.Status,
                CreatedAt = second.CreatedAt,
                CompletedAt = second.CompletedAt
            },
            new GoalMilestoneDto
            {
                Id = first.Id,
                GoalId = goal.Id,
                Title = first.Title,
                Notes = first.Notes,
                Order = 1,
                Status = first.Status,
                CreatedAt = first.CreatedAt,
                CompletedAt = first.CompletedAt
            }
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/goal-milestones/goal/{goal.Id}/reorder", reordered);

        // Assert
        var rawBody = await response.Content.ReadAsStringAsync();
        Assert.True(response.IsSuccessStatusCode, rawBody);

        var milestones = await response.Content.ReadFromJsonAsync<List<GoalMilestoneDto>>();

        Assert.NotNull(milestones);
        Console.WriteLine(rawBody);
        Assert.Equal(2, milestones!.Count);
        Assert.Equal("Second", milestones[0].Title);
        Assert.Equal(0, milestones[0].Order);
        Assert.Equal("First", milestones[1].Title);
        Assert.Equal(1, milestones[1].Order);
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

    private async Task<GoalMilestoneDto> CreateMilestoneAsync(
        string goalId,
        string title,
        int order,
        string status)
    {
        var request = new GoalMilestoneDto
        {
            Id = Guid.NewGuid().ToString(),
            GoalId = goalId,
            Title = title,
            Notes = null,
            Order = order,
            Status = status,
            CreatedAt = DateTime.UtcNow.ToString("O"),
            CompletedAt = null
        };

        var response = await _client.PostAsJsonAsync("/api/goal-milestones", request);

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<GoalMilestoneDto>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Id));

        return body;
    }

}

public class GoalMilestoneDto
{
    public string Id { get; set; } = string.Empty;
    public string GoalId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public int Order { get; set; }
    public string Status { get; set; } = "not_started";
    public string CreatedAt { get; set; } = string.Empty;
    public string? CompletedAt { get; set; }
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