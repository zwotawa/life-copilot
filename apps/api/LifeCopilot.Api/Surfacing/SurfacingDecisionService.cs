using System.Text.Json;
using LifeCopilot.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace LifeCopilot.Api.Surfacing;

public sealed class SurfacingDecisionService : ISurfacingDecisionService
{
    private readonly LifeCopilotDbContext _dbContext;

    public SurfacingDecisionService(LifeCopilotDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<SurfacingDecisionEventDto>> GetEventsForUserAsync(Guid userId)
    {
        var entities = await _dbContext.SurfacingDecisionEvents
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync();

        return entities.Select(MapToDto).ToList();
    }

    public async Task<SurfacingDecisionEventDto> AddEventAsync(Guid userId, SurfacingDecisionEventDto dto)
    {
        var entity = MapToEntity(userId, dto);

        _dbContext.SurfacingDecisionEvents.Add(entity);
        await _dbContext.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<List<SurfacingDecisionEventDto>> AddEventsAsync(Guid userId, List<SurfacingDecisionEventDto> dtos)
    {
        var entities = dtos.Select(dto => MapToEntity(userId, dto)).ToList();

        _dbContext.SurfacingDecisionEvents.AddRange(entities);
        await _dbContext.SaveChangesAsync();

        return entities.Select(MapToDto).ToList();
    }

    private static SurfacingDecisionEventEntity MapToEntity(Guid userId, SurfacingDecisionEventDto dto)
    {
        return new SurfacingDecisionEventEntity
        {
            Id = TryParseGuid(dto.Id) ?? Guid.NewGuid(),
            UserId = userId,
            Context = dto.Context,
            GoalId = TryParseGuid(dto.GoalId) ?? Guid.Empty,
            GoalTitle = dto.GoalTitle,
            Score = dto.Score,
            SuggestedCategory = dto.SuggestedCategory,
            ReasonsJson = JsonSerializer.Serialize(dto.Reasons ?? new List<string>()),
            MetadataJson = dto.Metadata is null ? null : JsonSerializer.Serialize(dto.Metadata),
            CreatedAtUtc = TryParseDateTime(dto.CreatedAt) ?? DateTime.UtcNow
        };
    }

    private static SurfacingDecisionEventDto MapToDto(SurfacingDecisionEventEntity entity)
    {
        return new SurfacingDecisionEventDto
        {
            Id = entity.Id.ToString(),
            CreatedAt = entity.CreatedAtUtc.ToString("O"),
            Context = entity.Context,
            GoalId = entity.GoalId.ToString(),
            GoalTitle = entity.GoalTitle,
            Score = entity.Score,
            SuggestedCategory = entity.SuggestedCategory,
            Reasons = DeserializeReasons(entity.ReasonsJson),
            Metadata = DeserializeMetadata(entity.MetadataJson)
        };
    }

    private static List<string> DeserializeReasons(string? reasonsJson)
    {
        if (string.IsNullOrWhiteSpace(reasonsJson))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(reasonsJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static SurfacingDecisionEventMetadataDto? DeserializeMetadata(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<SurfacingDecisionEventMetadataDto>(metadataJson);
        }
        catch
        {
            return null;
        }
    }

    private static Guid? TryParseGuid(string? value)
    {
        return Guid.TryParse(value, out var parsed) ? parsed : null;
    }

    private static DateTime? TryParseDateTime(string? value)
    {
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