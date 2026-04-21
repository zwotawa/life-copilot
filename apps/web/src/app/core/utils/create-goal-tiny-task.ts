import { GoalTinyTask } from '../models/goal-tiny-task.model';

export function createGoalTinyTask(
  goalId: string,
  milestoneId: string,
  title: string,
  order: number
): GoalTinyTask {
  return {
    id: crypto.randomUUID(),
    goalId,
    milestoneId,
    title,
    order,
    status: 'not_started',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}