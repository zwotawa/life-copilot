import { Goal } from "src/app/core/models/goal.model";

export function isGoalPlanningEligible(goal: Goal): boolean {
  return goal.status === 'active';
}

export function isGoalVisibleByDefault(goal: Goal): boolean {
  return goal.status !== 'archived';
}

export function isGoalExecutionEligible(goal: Goal): boolean {
  return goal.status === 'active';
}