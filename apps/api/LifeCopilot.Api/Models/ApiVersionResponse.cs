namespace LifeCopilot.Api.Meta;

public sealed class ApiVersionResponse
{
    public string AppName { get; init; } = string.Empty;
    public string Environment { get; init; } = string.Empty;
    public string Version { get; init; } = string.Empty;
    public string? CommitSha { get; init; }
    public string? BuildTimestampUtc { get; init; }
    public string ServerTimeUtc { get; init; } = string.Empty;
}