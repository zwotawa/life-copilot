

using System.Net;
using System.Net.Http.Json;
using LifeCopilot.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;

namespace LifeCopilot.Api.IntegrationTests.Goals;

public class GoalEndpointsTests: IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public GoalEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task User_can_create_and_retrieve_goal()
    {
        var email = $"test-{Guid.NewGuid()}@example.com";
        var password = "Test123!";
        var saveGoalRequest = new SaveGoalRequest
        {
            Id = "",
            Title = "title",
            WhyItMatters = "why it matters",
            Lane = "lane",
            Type = "type",
            Status = "status",
            Priority = "priority",
            DueStyle = "dueStyle",
            RealDeadline = "real deadline",
            TargetDate = "targetDate",
            MinimumTouchFrequency = "weekly",
            CurrentMilestone = "current milestone",
            NextTinyAction = "next tiny action",
            TypicalSessionSize = "typical session size",
            Energy = "energy",
            Resistance = "resistance",
            Excitement = "excitement",
            LastTouchedAt = "",
            Notes = "notes",
            CreatedAt = "",
            UpdatedAt = ""
        };

        await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest
        {
            Email = email,
            Password = password
        });

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });

        var loginBody = await loginResponse.Content.ReadFromJsonAsync<Auth.LoginResponse>();

        _client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginBody!.AccessToken);

        var createGoalResponse = await _client.PostAsJsonAsync("/api/goals", saveGoalRequest);

        Assert.Equal(HttpStatusCode.OK, createGoalResponse.StatusCode);

        var getGoalsResponse = await _client.GetAsync("/api/goals");

        Assert.Equal(HttpStatusCode.OK, getGoalsResponse.StatusCode);

        var goalResponseBody = await getGoalsResponse.Content.ReadFromJsonAsync<GoalDto[]>();

        Assert.Equal(saveGoalRequest.Title, goalResponseBody[0].Title);

    }
}