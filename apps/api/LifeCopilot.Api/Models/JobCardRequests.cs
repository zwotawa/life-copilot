namespace LifeCopilot.Api.Models;

public record CreateJobCardRequest(
    string Company,
    string Role,
    string Stage,
    string? Link,
    string? NextAction
);

public record UpdateJobCardRequest(
    string Company,
    string Role,
    string Stage,
    string? Link,
    string? NextAction
);