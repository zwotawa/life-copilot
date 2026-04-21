namespace LifeCopilot.Api.GoalTinyTasks;

public interface IGoalTinyTaskService
{
    Task<List<GoalTinyTaskDto>> GetTasksForMilestoneAsync(Guid userId, Guid milestoneId);
    Task<GoalTinyTaskDto> AddTaskAsync(Guid userId, GoalTinyTaskDto dto);
    Task<GoalTinyTaskDto> UpdateTaskAsync(Guid userId, Guid taskId, GoalTinyTaskDto dto);
    Task DeleteTaskAsync(Guid userId, Guid taskId);
}