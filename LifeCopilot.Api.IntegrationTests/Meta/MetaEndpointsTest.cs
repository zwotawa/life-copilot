using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace LifeCopilot.Api.IntegrationTests;

public class MetaEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public MetaEndpointsTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Version_endpoint_returns_success()
    {
        var response = await _client.GetAsync("/api/meta/version");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}