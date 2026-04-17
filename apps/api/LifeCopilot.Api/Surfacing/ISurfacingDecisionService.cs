namespace LifeCopilot.Api.Surfacing;

public interface ISurfacingDecisionService
{
    Task<List<SurfacingDecisionEventDto>> GetEventsForUserAsync(Guid userId);
    Task<SurfacingDecisionEventDto> AddEventAsync(Guid userId, SurfacingDecisionEventDto dto);
    Task<List<SurfacingDecisionEventDto>> AddEventsAsync(Guid userId, List<SurfacingDecisionEventDto> dtos);
}