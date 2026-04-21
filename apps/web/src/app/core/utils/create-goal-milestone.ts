import { GoalMilestone } from '../models/goal-milestone.model';

export function createGoalMilestone(
  goalId: string,
  title: string,
  order: number
): GoalMilestone {
  return {
    id: crypto.randomUUID(),
    goalId,
    title,
    notes: null,
    order,
    status: 'not_started',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}