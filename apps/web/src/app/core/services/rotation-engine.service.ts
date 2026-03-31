import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { GoalSurfacingService, SuggestedDailyCategory } from './goal-surfacing.service';

const STORAGE_KEY = 'lifeCopilot.dailyRotation';

interface ScoredGoalCandidate {
  goal: Goal;
  score: number;
  suggestedCategory: SuggestedDailyCategory | null;
}

@Injectable({
  providedIn: 'root'
})
export class RotationEngineService {

  constructor(private goalSurfacingService: GoalSurfacingService) {}

  public generateDailyRotation(
  goals: Goal[],
  weeklyReview: WeeklyReviewState
): DailyRotationItem[] {
  const activeGoals = goals.filter(goal => goal.status === 'active');

  const scoredCandidates: ScoredGoalCandidate[] = activeGoals.map(goal => {
    const result = this.goalSurfacingService.getSurfacingResult(goal, weeklyReview);

    return {
      goal,
      score: result.score,
      suggestedCategory: result.suggestedCategory
    };
  });

  const sortByScore = (candidates: ScoredGoalCandidate[]) =>
    candidates.slice().sort((a, b) => b.score - a.score);

  const responsiblePool = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.suggestedCategory === 'responsible'
    )
  );

  const responsiblePoolFallback = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.type === 'project' ||
      weeklyReview.anchorGoalIds.includes(candidate.goal.id) ||
      !!candidate.goal.nextTinyAction
    )
  );

  const momentumPool = sortByScore(
    scoredCandidates.filter(candidate =>
      weeklyReview.anchorGoalIds.includes(candidate.goal.id) ||
      candidate.suggestedCategory === 'momentum'
    )
  );

  const momentumPoolFallback = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.type === 'project' ||
      candidate.goal.excitement === 'high' ||
      candidate.goal.excitement === 'medium'
    )
  );

  const maintenancePool = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.type === 'maintain' ||
      candidate.suggestedCategory === 'maintenance'
    )
  );

  const maintenancePoolFallback = sortByScore(
    scoredCandidates.filter(candidate =>
      ['daily', '3x_week', 'weekly'].includes(candidate.goal.minimumTouchFrequency) ||
      [
        'life_systems',
        'money_admin',
        'home_environment',
        'mobility_transportation',
        'community_tools'
      ].includes(candidate.goal.lane)
    )
  );

  const interestingPool = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.type === 'exploration' ||
      candidate.suggestedCategory === 'interesting'
    )
  );

  const interestingPoolFallback = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.excitement === 'high' ||
      candidate.goal.lane === 'creative_experiments' ||
      candidate.goal.lane === 'skill_building' ||
      candidate.goal.type === 'exploration'
    )
  );

  const fallbackPool = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.typicalSessionSize === '5m' ||
      candidate.goal.typicalSessionSize === '10m' ||
      candidate.suggestedCategory === 'fallback'
    )
  );

  const fallbackPoolFallback = sortByScore(
    scoredCandidates.filter(candidate =>
      candidate.goal.typicalSessionSize === '5m' ||
      candidate.goal.typicalSessionSize === '10m' ||
      candidate.goal.resistance === 'low' ||
      !!candidate.goal.nextTinyAction
    )
  );

  const ultimateFallbackPool = sortByScore(scoredCandidates);

  const usedGoalIds = new Set<string>();

  const responsibleGoal = this.pickFromPoolWithFallback(
    responsiblePool,
    responsiblePoolFallback,
    usedGoalIds,
    ultimateFallbackPool

  )?.goal;

  const momentumGoal = this.pickFromPoolWithFallback(
    momentumPool,
    momentumPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  )?.goal;

  const maintenanceGoal = this.pickFromPoolWithFallback(
    maintenancePool,
    maintenancePoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  )?.goal;

  const interestingGoal = this.pickFromPoolWithFallback(
    interestingPool,
    interestingPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  )?.goal;

  const fallbackGoal = this.pickFromPoolWithFallback(
    fallbackPool,
    fallbackPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  )?.goal;

  const dailyRotationItems: DailyRotationItem[] = [
    this.toRotationItem('responsible', responsibleGoal),
    this.toRotationItem('momentum', momentumGoal),
    this.toRotationItem('maintenance', maintenanceGoal),
    this.toRotationItem('interesting', interestingGoal),
    this.toRotationItem('fallback', fallbackGoal)
  ];

  this.saveRotationItems(dailyRotationItems);
  return dailyRotationItems;
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

  public saveRotationItems(items: DailyRotationItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  public loadRotationItems(): DailyRotationItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  }

  private pickFromPoolWithFallback(
    primaryPool: ScoredGoalCandidate[],
    fallbackPool: ScoredGoalCandidate[],
    usedGoalIds: Set<string>,
    allCandidates: ScoredGoalCandidate[]
  ): ScoredGoalCandidate | null {
    return (
      this.pickFromPool(primaryPool, usedGoalIds) ??
      this.pickFromPool(fallbackPool, usedGoalIds) ??
      this.pickFromPool(allCandidates, usedGoalIds)
    );
  }

  private pickFromPool(
    pool: ScoredGoalCandidate[],
    usedGoalIds: Set<string>
  ): ScoredGoalCandidate | null {
    const available = pool.filter(candidate => !usedGoalIds.has(candidate.goal.id));

    if (!available.length) {
      return null;
    }

    const selected = this.pickOneWithVariety(available);
    usedGoalIds.add(selected.goal.id);
    return selected;
  }

  private pickOneWithVariety(pool: ScoredGoalCandidate[]): ScoredGoalCandidate {
    const topCandidates = pool.slice(0, Math.min(3, pool.length));
    const randomIndex = Math.floor(Math.random() * topCandidates.length);
    return topCandidates[randomIndex];
  }
}