namespace LifeCopilot.Api.GoalMilestones;

public interface IGoalMilestoneService
{
    Task<List<GoalMilestoneDto>> GetMilestonesForGoalAsync(Guid userId, Guid goalId);
    Task<GoalMilestoneDto> AddMilestoneAsync(Guid userId, GoalMilestoneDto dto);
    Task<GoalMilestoneDto> UpdateMilestoneAsync(Guid userId, Guid milestoneId, GoalMilestoneDto dto);
    Task DeleteMilestoneAsync(Guid userId, Guid milestoneId);
    Task<List<GoalMilestoneDto>> ReorderMilestonesAsync(Guid userId, Guid goalId, List<GoalMilestoneDto> milestones);
}