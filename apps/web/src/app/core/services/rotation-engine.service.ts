import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { WeeklyReviewState } from '../models/weekly-review.model';

@Injectable({
  providedIn: 'root'
})
export class RotationEngineService {
  public generateDailyRotation(
    goals: Goal[],
    weeklyReview: WeeklyReviewState
  ): DailyRotationItem[] {
    const activeGoals = goals.filter(goal => goal.status === 'active');

    const findById = (id: string | null | undefined): Goal | undefined =>
      activeGoals.find(goal => goal.id === id);

    const anchorGoals = weeklyReview.anchorGoalIds
      .map(id => findById(id))
      .filter((goal): goal is Goal => !!goal);

    const maintenanceGoals = weeklyReview.maintenanceGoalIds
      .map(id => findById(id))
      .filter((goal): goal is Goal => !!goal);

    const infrastructureGoal = findById(weeklyReview.infrastructureGoalId);
    const creativeGoal = findById(weeklyReview.creativeGoalId);

    const responsibleGoal =
      infrastructureGoal ??
      activeGoals.find(goal => goal.dueStyle !== 'cadence_only') ??
      anchorGoals[0] ??
      activeGoals[0];

    const momentumGoal =
      anchorGoals[0] ??
      activeGoals.find(goal => goal.type === 'project') ??
      activeGoals[0];

    const maintenanceGoal =
      maintenanceGoals[0] ??
      activeGoals.find(goal => goal.type === 'maintain') ??
      activeGoals[0];

    const interestingGoal =
      creativeGoal ??
      activeGoals.find(goal => goal.type === 'exploration') ??
      anchorGoals[1] ??
      anchorGoals[0] ??
      activeGoals[0];

    const fallbackGoal =
      activeGoals.find(goal =>
        (goal.typicalSessionSize === '5m' || goal.typicalSessionSize === '10m') &&
        goal.resistance === 'low'
      ) ??
      maintenanceGoals[0] ??
      activeGoals.find(goal => goal.resistance === 'low') ??
      activeGoals[0];

    return [
      this.toRotationItem('responsible', responsibleGoal),
      this.toRotationItem('momentum', momentumGoal),
      this.toRotationItem('maintenance', maintenanceGoal),
      this.toRotationItem('interesting', interestingGoal),
      this.toRotationItem('fallback', fallbackGoal)
    ];
  }

  private toRotationItem(category: DailyRotationItem['category'], goal?: Goal): DailyRotationItem {
    const today = new Date().toISOString();

    return {
      id: `${category}-${goal?.id ?? 'none'}-${Date.now()}`,
      date: today,
      category,
      goalId: goal?.id ?? null,
      goalTitle: goal?.title ?? 'No goal selected',
      actionText: goal?.nextTinyAction ?? 'Define the next tiny action',
      sessionSize: goal?.typicalSessionSize ?? null,
      completed: false
    };
  }
}