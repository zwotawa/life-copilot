
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using LifeCopilot.Api.GoalMilestones;
using LifeCopilot.Api.GoalTinyTasks;
using Microsoft.AspNetCore.Mvc.Testing;

namespace LifeCopilot.Api.IntegrationTests.GoalTinyTask;

public class GoalTinyTaskEndpointsTests: IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public GoalTinyTaskEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Create_tiny_task_returns_created_tiny_task()
    {
        //Arrange
        var email = $"tiny-tasks-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();

        var milestone = await CreateMilestoneAsync(goal.Id, "Testing Tiny Task", 0, "not started");

        var request = new GoalTinyTaskDto
        {
            Id = Guid.NewGuid().ToString(),
            GoalId = goal.Id,
            MilestoneId = milestone.Id,
            Title = "Tiny Task for Test",
            Order = 0,
            Status = "not_started",
            CreatedAt = DateTime.UtcNow.ToString("O"),
            CompletedAt = null
        };

        var response = await _client.PostAsJsonAsync("api/goal-tiny-tasks", request);

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<GoalTinyTaskDto>();

        Assert.NotNull(body);
        Assert.Equal(goal.Id, body!.GoalId);
        Assert.Equal(milestone.Id, body!.MilestoneId);
        Assert.Equal("Tiny Task for Test", body.Title);
        Assert.Equal(0, body.Order);
        Assert.Equal("not_started", body.Status);
    }

    [Fact]
    public async Task Get_tiny_tasks_for_milestone_returns_tiny_tasks_in_order()
    {
        //Arrange
        var email = $"tiny-tasks-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();

        var milestone = await CreateMilestoneAsync(goal.Id, "Testing Tiny Task", 0, "active");

        var tinyTaskA = await CreateTinyTaskAsync(goal.Id, milestone.Id, "tiny test a", 0, "completed");
        var tinyTaskB = await CreateTinyTaskAsync(goal.Id, milestone.Id, "tiny test b", 1, "not_started");

        //Act
        var response = await _client.GetAsync($"/api/goal-tiny-tasks/milestone/{milestone.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var tinyTasks = await response.Content.ReadFromJsonAsync<List<GoalTinyTaskDto>>();

        Assert.NotNull(tinyTasks);
        Assert.Equal(2, tinyTasks!.Count);

        Assert.Equal("tiny test a", tinyTasks[0].Title);
        Assert.Equal("tiny test b", tinyTasks[1].Title);
    }

    [Fact]
    public async Task Update_tiny_task_updates_title_status_and_order()
    {
        //Arrange
        var email = $"tiny-tasks-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();
        var milestone = await CreateMilestoneAsync(goal.Id, "Testing Tiny Task Update", 0, "active");

        var tinyTask = await CreateTinyTaskAsync(goal.Id, milestone.Id, "Old Title", 0, "not_started");

        var updateRequest = new GoalTinyTaskDto
        {
            Id = tinyTask.Id,
            GoalId = goal.Id,
            MilestoneId = milestone.Id,
            Title = "Updated Title",
            Order = 2,
            Status = "completed",
            CreatedAt = tinyTask.CreatedAt,
            CompletedAt = DateTime.UtcNow.ToString("O")
        };

        //Act
        var response = await _client.PutAsJsonAsync($"/api/goal-tiny-tasks/{tinyTask.Id}", updateRequest);

        //Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updated = await response.Content.ReadFromJsonAsync<GoalTinyTaskDto>();

        Assert.NotNull(updated);
        Assert.Equal("Updated Title", updated!.Title);
        Assert.Equal("completed", updated.Status);
        Assert.Equal(2, updated.Order);
        Assert.NotNull(updated.CompletedAt);
    }

    [Fact]
    public async Task Delete_tiny_task_removes_it()
    {
        //Arrange
        var email = $"tiny-tasks-{Guid.NewGuid()}@example.com";
        var password = "Test123!";

        await RegisterAsync(email, password);
        var token = await LoginAsync(email, password);

        _client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", token);

        var goal = await CreateGoalAsync();
        var milestone = await CreateMilestoneAsync(goal.Id, "Testing Tiny Task Update", 0, "active");
        var tinyTask = await CreateTinyTaskAsync(goal.Id, milestone.Id, "Delete me", 0, "not_started");

        //Act
        var deleteResponse = await _client.DeleteAsync($"/api/goal-tiny-tasks/{tinyTask.Id}");

        //Assert
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        //Assert get it return nothing
        var getResponse = await _client.GetAsync($"/api/goal-tiny-tasks/milestone/{milestone.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var tinyTasks = await getResponse.Content.ReadFromJsonAsync<List<GoalTinyTaskDto>>();
        Assert.NotNull(tinyTasks);
        Assert.DoesNotContain(tinyTasks!, t => t.Id == tinyTask.Id);
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

    private async Task<GoalTinyTaskDto> CreateTinyTaskAsync(
        string goalId,
        string milestoneId,
        string title,
        int order,
        string status
    )
    {
        var request = new GoalTinyTaskDto
        {
            Id = Guid.NewGuid().ToString(),
            GoalId = goalId,
            MilestoneId = milestoneId,
            Title = title,
            Order = order,
            Status = status,
            CreatedAt = DateTime.UtcNow.ToString("O"),
            CompletedAt = null
        };

        var response = await _client.PostAsJsonAsync("api/goal-tiny-tasks", request);

        Assert.True(response.IsSuccessStatusCode, await response.Content.ReadAsStringAsync());

        var body = await response.Content.ReadFromJsonAsync<GoalTinyTaskDto>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Id));

        return body;
    }
}