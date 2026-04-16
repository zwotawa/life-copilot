namespace LifeCopilot.Api.Common;

public sealed class ApiErrorResponse
{
    public string Message { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string RequestId { get; init; } = string.Empty;
}