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

    const usedGoalIds = new Set<string>();

    const responsibleGoal = this.pickGoal(
      [
        ...(infrastructureGoal ? [infrastructureGoal] : []),
        ...activeGoals.filter(goal => goal.dueStyle !== 'cadence_only'),
        ...anchorGoals,
        ...activeGoals
      ],
      usedGoalIds
    );

    const momentumGoal = this.pickGoal(
      [
        ...anchorGoals,
        ...activeGoals.filter(goal => goal.type === 'project'),
        ...activeGoals
      ],
      usedGoalIds
    );

    const maintenanceGoal = this.pickGoal(
      [
        ...maintenanceGoals,
        ...activeGoals.filter(goal => goal.type === 'maintain'),
        ...activeGoals
      ],
      usedGoalIds
    );

    const interestingGoal = this.pickGoal(
      [
        ...(creativeGoal ? [creativeGoal] : []),
        ...activeGoals.filter(goal => goal.type === 'exploration'),
        ...anchorGoals,
        ...activeGoals
      ],
      usedGoalIds
    );

    const fallbackGoal = this.pickGoal(
      [
        ...activeGoals.filter(goal =>
          (goal.typicalSessionSize === '5m' || goal.typicalSessionSize === '10m') &&
          goal.resistance === 'low'
        ),
        ...maintenanceGoals,
        ...activeGoals.filter(goal => goal.resistance === 'low'),
        ...activeGoals
      ],
      usedGoalIds
    );

    return [
      this.toRotationItem('responsible', responsibleGoal),
      this.toRotationItem('momentum', momentumGoal),
      this.toRotationItem('maintenance', maintenanceGoal),
      this.toRotationItem('interesting', interestingGoal),
      this.toRotationItem('fallback', fallbackGoal)
    ];
  }

  private pickGoal(candidates: Goal[], usedGoalIds: Set<string>): Goal | undefined {
    const uniqueCandidates = this.uniqueGoals(candidates);

    const unusedCandidates = uniqueCandidates.filter(goal => !usedGoalIds.has(goal.id));
    const pool = unusedCandidates.length > 0 ? unusedCandidates : uniqueCandidates;

    if (pool.length === 0) {
      return undefined;
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    usedGoalIds.add(selected.id);
    return selected;
  }

  private uniqueGoals(goals: Goal[]): Goal[] {
    const seen = new Set<string>();
    return goals.filter(goal => {
      if (seen.has(goal.id)) {
        return false;
      }
      seen.add(goal.id);
      return true;
    });
  }

  private toRotationItem(category: DailyRotationItem['category'], goal?: Goal): DailyRotationItem {
    const today = new Date().toISOString();

    return {
      id: `${category}-${goal?.id ?? 'none'}-${Date.now()}-${Math.random()}`,
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