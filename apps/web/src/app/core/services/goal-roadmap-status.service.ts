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
      const hasAnyMilestones = goalMilestones.length > 0;
      let activeTasks: GoalTinyTask[] = [];
      let completedTinyTaskCount = 0;
      let remainingTinyTaskCount = 0;

      if (!activeMilestone) {
        activeTasks = [];
        completedTinyTaskCount = 0;
        remainingTinyTaskCount = 0;
      } else {
        activeTasks = tinyTasks
          .filter(task => task.milestoneId === activeMilestone.id)
          .sort((a, b) => a.order - b.order);
  
        completedTinyTaskCount = activeTasks.filter(task => task.status === 'completed').length;
        remainingTinyTaskCount = activeTasks.filter(task => task.status !== 'completed').length;
      }

      const hasActiveMilestone = !!activeMilestone;

      const planningState =
        !activeMilestone
          ? 'no_active_milestone'
          : activeTasks.length === 0
            ? 'no_tasks'
            : remainingTinyTaskCount === 0
              ? 'all_tasks_complete'
              : 'has_remaining_tasks';

      statusByGoalId[goal.id] = {
        hasActiveMilestone,
        activeMilestoneTitle: activeMilestone?.title ?? null,
        completedMilestoneCount: goalMilestones.filter(m => m.status === 'completed').length,
        totalMilestoneCount: goalMilestones.length,
        completedTinyTaskCount,
        totalTinyTaskCount: activeTasks.length,
        needsPlanning: planningState === 'no_tasks' || planningState === 'all_tasks_complete',
        planningState,

        hasAnyMilestones,
        missingRoadmap: !hasAnyMilestones,
        missingNextAction: planningState === 'no_tasks' || planningState === 'all_tasks_complete'
      };
    }

    return statusByGoalId;
  }
}