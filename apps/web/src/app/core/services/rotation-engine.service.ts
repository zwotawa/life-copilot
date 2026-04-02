import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { GoalSurfacingService, SuggestedDailyCategory } from './goal-surfacing.service';

interface ScoredGoalCandidate {
  goal: Goal;
  score: number;
  suggestedCategory: SuggestedDailyCategory | null;
  reasons: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RotationEngineService {

  constructor(
    private goalSurfacingService: GoalSurfacingService  
  ) {}

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
      suggestedCategory: result.suggestedCategory,
      reasons: result.reasons
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

  );

  const momentumGoal = this.pickFromPoolWithFallback(
    momentumPool,
    momentumPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  );

  const maintenanceGoal = this.pickFromPoolWithFallback(
    maintenancePool,
    maintenancePoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  );

  const interestingGoal = this.pickFromPoolWithFallback(
    interestingPool,
    interestingPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  );

  const fallbackGoal = this.pickFromPoolWithFallback(
    fallbackPool,
    fallbackPoolFallback,
    usedGoalIds,
    ultimateFallbackPool
  );

  const dailyRotationItems: DailyRotationItem[] = [
    this.toRotationItem('responsible', responsibleGoal),
    this.toRotationItem('momentum', momentumGoal),
    this.toRotationItem('maintenance', maintenanceGoal),
    this.toRotationItem('interesting', interestingGoal),
    this.toRotationItem('fallback', fallbackGoal)
  ];
  return dailyRotationItems;
}

private toRotationItem(
  category: DailyRotationItem['category'],
  candidate?: ScoredGoalCandidate | null
): DailyRotationItem {
  const today = new Date().toISOString();

  return {
    id: `${category}-${candidate?.goal.id ?? 'none'}-${Date.now()}-${Math.random()}`,
    date: today,
    category,
    goalId: candidate?.goal.id ?? null,
    goalTitle: candidate?.goal.title ?? 'No goal selected',
    actionText: candidate?.goal.nextTinyAction ?? 'Define the next tiny action',
    sessionSize: candidate?.goal.typicalSessionSize ?? null,
    completed: false,
    surfacingScore: candidate?.score ?? null,
    surfacingReasons: candidate
      ? this.formatSurfacingReasons(candidate.reasons).slice(0, 3)
      : []
  };
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

  private formatSurfacingReasons(reasons: string[]): string[] {
  return reasons
    .map(reason => {
      if (reason.startsWith('due timing:')) return 'Due soon or overdue';
      if (reason.startsWith('weekly role:')) return 'Chosen in weekly focus';
      if (reason.startsWith('staleness:')) return 'Has not been touched recently';
      if (reason.startsWith('touch frequency:')) return 'Needs regular attention';
      if (reason.startsWith('excitement:')) return 'High interest or momentum';
      if (reason.startsWith('resistance:')) return 'Worth surfacing despite resistance';
      if (reason.startsWith('status active:')) return 'Currently active';

      return reason;
    })
    .filter((reason, index, array) => array.indexOf(reason) === index);
}
}