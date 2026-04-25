import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalMilestone } from '../models/goal-milestone.model';
import { GoalTinyTask } from '../models/goal-tiny-task.model';
import { GoalRoadmapStatus } from '../models/goal-roadmap-status.model';

@Injectable({
  providedIn: 'root'
})
export class GoalRoadmapStatusService {
  public buildStatusByGoalId(
    goals: Goal[],
    milestones: GoalMilestone[],
    tinyTasks: GoalTinyTask[]
  ): Record<string, GoalRoadmapStatus> {
    const statusByGoalId: Record<string, GoalRoadmapStatus> = {};

    for (const goal of goals) {
      const goalMilestones = milestones.filter(m => m.goalId === goal.id);
      const activeMilestone = goalMilestones.find(m => m.status === 'active') ?? null;

      if (!activeMilestone) {
        statusByGoalId[goal.id] = {
          hasActiveMilestone: false,
          activeMilestoneTitle: null,
          completedMilestoneCount: goalMilestones.filter(m => m.status === 'completed').length,
          totalMilestoneCount: goalMilestones.length,
          completedTinyTaskCount: 0,
          totalTinyTaskCount: 0,
          needsPlanning: false,
          planningState: 'no_active_milestone'
        };
        continue;
      }

      const activeTasks = tinyTasks
        .filter(task => task.milestoneId === activeMilestone.id)
        .sort((a, b) => a.order - b.order);

      const completedTinyTaskCount = activeTasks.filter(task => task.status === 'completed').length;
      const remainingTinyTaskCount = activeTasks.filter(task => task.status !== 'completed').length;

      const planningState =
        activeTasks.length === 0
          ? 'no_tasks'
          : remainingTinyTaskCount === 0
            ? 'all_tasks_complete'
            : 'has_remaining_tasks';

      statusByGoalId[goal.id] = {
        hasActiveMilestone: true,
        activeMilestoneTitle: activeMilestone.title,
        completedMilestoneCount: goalMilestones.filter(m => m.status === 'completed').length,
        totalMilestoneCount: goalMilestones.length,
        completedTinyTaskCount,
        totalTinyTaskCount: activeTasks.length,
        needsPlanning: planningState !== 'has_remaining_tasks',
        planningState
      };
    }

    return statusByGoalId;
  }
}