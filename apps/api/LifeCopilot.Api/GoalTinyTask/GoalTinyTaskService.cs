using LifeCopilot.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.GoalTinyTasks;

public sealed class GoalTinyTaskService : IGoalTinyTaskService
{
    private readonly LifeCopilotDbContext _dbContext;

    public GoalTinyTaskService(LifeCopilotDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<GoalTinyTaskDto>> GetTasksForMilestoneAsync(Guid userId, Guid milestoneId)
    {
        var entities = await _dbContext.GoalTinyTasks
            .Where(x => x.UserId == userId && x.MilestoneId == milestoneId)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.CreatedAtUtc)
            .ToListAsync();

        return entities.Select(MapToDto).ToList();
    }

    public async Task<GoalTinyTaskDto> AddTaskAsync(Guid userId, GoalTinyTaskDto dto)
    {
        var goalId = ParseRequiredGuid(dto.GoalId, nameof(dto.GoalId));
        var milestoneId = ParseRequiredGuid(dto.MilestoneId, nameof(dto.MilestoneId));

        var entity = new GoalTinyTaskEntity
        {
            Id = TryParseGuid(dto.Id) ?? Guid.NewGuid(),
            UserId = userId,
            GoalId = goalId,
            MilestoneId = milestoneId,
            Title = dto.Title,
            Order = dto.Order,
            Status = NormalizeStatus(dto.Status),
            CreatedAtUtc = ParseDateTimeOrDefaultUtc(dto.CreatedAt, DateTime.UtcNow),
            CompletedAtUtc = ParseNullableDateTimeUtc(dto.CompletedAt)
        };

        _dbContext.GoalTinyTasks.Add(entity);
        await _dbContext.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<GoalTinyTaskDto> UpdateTaskAsync(Guid userId, Guid taskId, GoalTinyTaskDto dto)
    {
        var entity = await _dbContext.GoalTinyTasks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == taskId);

        if (entity is null)
        {
            throw new InvalidOperationException("Tiny task not found.");
        }

        entity.Title = dto.Title;
        entity.Order = dto.Order;
        entity.Status = NormalizeStatus(dto.Status);
        entity.CompletedAtUtc = ParseNullableDateTimeUtc(dto.CompletedAt);

        await _dbContext.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task DeleteTaskAsync(Guid userId, Guid taskId)
    {
        var entity = await _dbContext.GoalTinyTasks
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == taskId);

        if (entity is null)
        {
            return;
        }

        _dbContext.GoalTinyTasks.Remove(entity);
        await _dbContext.SaveChangesAsync();
    }

    private static GoalTinyTaskDto MapToDto(GoalTinyTaskEntity entity)
    {
        return new GoalTinyTaskDto
        {
            Id = entity.Id.ToString(),
            GoalId = entity.GoalId.ToString(),
            MilestoneId = entity.MilestoneId.ToString(),
            Title = entity.Title,
            Order = entity.Order,
            Status = entity.Status,
            CreatedAt = entity.CreatedAtUtc.ToString("O"),
            CompletedAt = entity.CompletedAtUtc?.ToString("O")
        };
    }

    private static string NormalizeStatus(string? status)
    {
        return status switch
        {
            "not_started" => "not_started",
            "completed" => "completed",
            _ => "not_started"
        };
    }

    private static Guid ParseRequiredGuid(string? value, string fieldName)
    {
        if (Guid.TryParse(value, out var parsed))
        {
            return parsed;
        }

        throw new InvalidOperationException($"{fieldName} was missing or invalid.");
    }

    private static Guid? TryParseGuid(string? value)
    {
        return Guid.TryParse(value, out var parsed) ? parsed : null;
    }

    private static DateTime ParseDateTimeOrDefaultUtc(string? value, DateTime fallbackUtc)
    {
        var parsed = ParseNullableDateTimeUtc(value);
        return parsed ?? fallbackUtc;
    }

    private static DateTime? ParseNullableDateTimeUtc(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(
                value,
                null,
                System.Globalization.DateTimeStyles.RoundtripKind,
                out var parsed))
        {
            return null;
        }

        return parsed.UtcDateTime;
    }
}