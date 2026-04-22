import { Injectable } from '@angular/core';
import { GoalMilestone } from '../models/goal-milestone.model';
import { GoalTinyTask } from '../models/goal-tiny-task.model';
import { GoalExecutionContext } from '../models/goal-execution-context.model';

@Injectable({
  providedIn: 'root'
})
export class GoalExecutionContextService {
  public buildExecutionContextByGoalId(
    milestones: GoalMilestone[],
    tinyTasks: GoalTinyTask[]
  ): Record<string, GoalExecutionContext> {
    const contextByGoalId: Record<string, GoalExecutionContext> = {};

    const activeMilestones = milestones.filter(m => m.status === 'active');

    for (const milestone of activeMilestones) {
      const milestoneTasks = tinyTasks
        .filter(task =>
          task.goalId === milestone.goalId &&
          task.milestoneId === milestone.id &&
          task.status !== 'completed'
        )
        .sort((a, b) => a.order - b.order);

      const nextTinyTask = milestoneTasks[0] ?? null;

      contextByGoalId[milestone.goalId] = {
        activeMilestoneTitle: milestone.title,
        nextTinyTaskTitle: nextTinyTask?.title ?? null
      };
    }

    return contextByGoalId;
  }
}