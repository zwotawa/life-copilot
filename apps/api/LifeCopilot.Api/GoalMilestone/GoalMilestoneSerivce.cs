using LifeCopilot.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.GoalMilestones;

public sealed class GoalMilestoneService : IGoalMilestoneService
{
    private readonly LifeCopilotDbContext _dbContext;

    public GoalMilestoneService(LifeCopilotDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<GoalMilestoneDto>> GetMilestonesForGoalAsync(Guid userId, Guid goalId)
    {
        var entities = await _dbContext.GoalMilestones
            .Where(x => x.UserId == userId && x.GoalId == goalId)
            .OrderBy(x => x.Order)
            .ThenBy(x => x.CreatedAtUtc)
            .ToListAsync();

        return entities.Select(MapToDto).ToList();
    }

    public async Task<GoalMilestoneDto> AddMilestoneAsync(Guid userId, GoalMilestoneDto dto)
    {
        var goalId = ParseRequiredGuid(dto.GoalId, nameof(dto.GoalId));

        var entity = new GoalMilestoneEntity
        {
            Id = TryParseGuid(dto.Id) ?? Guid.NewGuid(),
            UserId = userId,
            GoalId = goalId,
            Title = dto.Title,
            Notes = dto.Notes,
            Order = dto.Order,
            Status = NormalizeStatus(dto.Status),
            CreatedAtUtc = ParseDateTimeOrDefaultUtc(dto.CreatedAt, DateTime.UtcNow),
            CompletedAtUtc = ParseNullableDateTimeUtc(dto.CompletedAt)
        };

        _dbContext.GoalMilestones.Add(entity);
        await _dbContext.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<GoalMilestoneDto> UpdateMilestoneAsync(Guid userId, Guid milestoneId, GoalMilestoneDto dto)
    {
        var entity = await _dbContext.GoalMilestones
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == milestoneId);

        if (entity is null)
        {
            throw new InvalidOperationException("Milestone not found.");
        }

        entity.Title = dto.Title;
        entity.Notes = dto.Notes;
        entity.Order = dto.Order;
        entity.Status = NormalizeStatus(dto.Status);
        entity.CompletedAtUtc = ParseNullableDateTimeUtc(dto.CompletedAt);

        await _dbContext.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task DeleteMilestoneAsync(Guid userId, Guid milestoneId)
    {
        var entity = await _dbContext.GoalMilestones
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Id == milestoneId);

        if (entity is null)
        {
            return;
        }

        _dbContext.GoalMilestones.Remove(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<GoalMilestoneDto>> ReorderMilestonesAsync(
        Guid userId,
        Guid goalId,
        List<GoalMilestoneDto> milestones)
    {
        if (milestones is null || milestones.Count == 0)
        {
            return new List<GoalMilestoneDto>();
        }

        var parsedDtos = milestones
            .Select(dto => new
            {
                Dto = dto,
                Id = ParseRequiredGuid(dto.Id, nameof(dto.Id))
            })
            .ToList();

        var milestoneIds = parsedDtos
            .Select(x => x.Id)
            .ToHashSet();

        var entities = await _dbContext.GoalMilestones
            .Where(x => x.UserId == userId && x.GoalId == goalId && milestoneIds.Contains(x.Id))
            .ToListAsync();

        if (entities.Count != parsedDtos.Count)
        {
            throw new InvalidOperationException("One or more milestones could not be found for reorder.");
        }

        var dtoById = parsedDtos.ToDictionary(x => x.Id, x => x.Dto);

        foreach (var entity in entities)
        {
            var dto = dtoById[entity.Id];

            entity.Order = dto.Order;
            entity.Title = dto.Title;
            entity.Notes = dto.Notes;
            entity.Status = NormalizeStatus(dto.Status);
            entity.CompletedAtUtc = ParseNullableDateTimeUtc(dto.CompletedAt);
        }

        await _dbContext.SaveChangesAsync();

        return entities
            .OrderBy(x => x.Order)
            .ThenBy(x => x.CreatedAtUtc)
            .Select(MapToDto)
            .ToList();
    }

    private static GoalMilestoneDto MapToDto(GoalMilestoneEntity entity)
    {
        return new GoalMilestoneDto
        {
            Id = entity.Id.ToString(),
            GoalId = entity.GoalId.ToString(),
            Title = entity.Title,
            Notes = entity.Notes,
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
            "active" => "active",
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