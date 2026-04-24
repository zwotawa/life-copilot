import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalMilestone } from '../models/goal-milestone.model';
import { GoalTinyTask } from '../models/goal-tiny-task.model';
import {
  GoalRoadmapInsights,
  GoalRoadmapProgressItem
} from '../models/goal-roadmap-insights.model';

@Injectable({
  providedIn: 'root'
})
export class GoalRoadmapInsightsService {
  public getInsights(
    goals: Goal[],
    milestones: GoalMilestone[],
    tinyTasks: GoalTinyTask[]
  ): GoalRoadmapInsights {
    const activeMilestones = milestones.filter(m => m.status === 'active');
    const completedMilestones = milestones.filter(m => m.status === 'completed');
    const completedTinyTasks = tinyTasks.filter(task => task.status === 'completed');

    const activeGoalSnapshots: GoalRoadmapProgressItem[] = activeMilestones
      .map<GoalRoadmapProgressItem | null>(activeMilestone => {
        const goal = goals.find(g => g.id === activeMilestone.goalId);
        if (!goal) {
          return null;
        }

        const goalMilestones = milestones.filter(m => m.goalId === goal.id);
        const activeMilestoneTasks = tinyTasks
          .filter(task => task.milestoneId === activeMilestone.id)
          .sort((a, b) => a.order - b.order);

        const completedTinyTaskCount = activeMilestoneTasks.filter(
          task => task.status === 'completed'
        ).length;

        const remainingTinyTaskCount = activeMilestoneTasks.filter(
          task => task.status !== 'completed'
        ).length;

        const planningState =
        activeMilestoneTasks.length === 0
            ? 'no_tasks'
            : remainingTinyTaskCount === 0
            ? 'all_tasks_complete'
            : 'has_remaining_tasks';

        return {
          goalId: goal.id,
          goalTitle: goal.title,
          activeMilestoneTitle: activeMilestone.title,
          completedMilestoneCount: goalMilestones.filter(m => m.status === 'completed').length,
          totalMilestoneCount: goalMilestones.length,
          completedTinyTaskCount,
          totalTinyTaskCount: activeMilestoneTasks.length,
          needsPlanning: remainingTinyTaskCount === 0,
          planningState
        };
      })
      .filter((item): item is GoalRoadmapProgressItem => item !== null)
      .sort((a, b) => {
        if (a.needsPlanning !== b.needsPlanning) {
          return a.needsPlanning ? -1 : 1;
        }

        const aPercent = a.totalTinyTaskCount === 0
          ? 0
          : a.completedTinyTaskCount / a.totalTinyTaskCount;

        const bPercent = b.totalTinyTaskCount === 0
          ? 0
          : b.completedTinyTaskCount / b.totalTinyTaskCount;

        return bPercent - aPercent;
      })
      .slice(0, 5);

    return {
      goalsWithActiveMilestonesCount: activeMilestones.length,
      completedMilestonesCount: completedMilestones.length,
      completedTinyTasksCount: completedTinyTasks.length,
      goalsNeedingPlanningCount: activeGoalSnapshots.filter(item => item.needsPlanning).length,
      activeGoalSnapshots
    };
  }
}