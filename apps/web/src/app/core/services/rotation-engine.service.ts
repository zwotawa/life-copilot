import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { GoalBehaviorEvidence, GoalSurfacingResult, GoalSurfacingService, SuggestedDailyCategory } from './goal-surfacing.service';
import { GoalExecutionContext } from '../models/goal-execution-context.model';

interface ScoredGoalCandidate {
  goal: Goal;
  score: number;
  suggestedCategory: SuggestedDailyCategory | null;
  reasons: string[];
}

type WeeklyRole = 'anchor' | 'maintenance' | 'infrastructure' | 'creative';

@Injectable({
  providedIn: 'root'
})
export class RotationEngineService {

  private readonly weeklyRoleCategoryAdjustments: Record<
    WeeklyRole,
    Partial<Record<SuggestedDailyCategory, number>>
  > = {
    anchor: {
      momentum: 6,
      responsible: 3
    },
    maintenance: {
      maintenance: 6,
      fallback: 3
    },
    infrastructure: {
      responsible: 6,
      maintenance: 3
    },
    creative: {
      interesting: 6,
      momentum: 3
    }
  };

  constructor(
    private goalSurfacingService: GoalSurfacingService  
  ) {}

  public generateDailyRotation(
  goals: Goal[],
  weeklyReview: WeeklyReviewState,
  evidenceByGoalId: Record<string, GoalBehaviorEvidence>,
  executionContextByGoalId: Record<string, GoalExecutionContext> = {}
): DailyRotationItem[] {
  const activeGoals = goals.filter(goal => goal.status === 'active');

  const scoredCandidates: ScoredGoalCandidate[] = activeGoals.map(goal => {
    const result = this.getAdjustedDailySurfacingResult(goal, weeklyReview, evidenceByGoalId);

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
    this.toRotationItem('responsible', executionContextByGoalId, responsibleGoal),
    this.toRotationItem('momentum', executionContextByGoalId, momentumGoal),
    this.toRotationItem('maintenance', executionContextByGoalId, maintenanceGoal),
    this.toRotationItem('interesting', executionContextByGoalId, interestingGoal),
    this.toRotationItem('fallback', executionContextByGoalId, fallbackGoal)
  ];
  return dailyRotationItems;
}

private toRotationItem(
  category: DailyRotationItem['category'],
  executionContextByGoalId: Record<string, GoalExecutionContext> = {},
  candidate?: ScoredGoalCandidate | null
): DailyRotationItem {
  const today = new Date().toISOString();

  const executionContext = candidate?.goal.id ? executionContextByGoalId[candidate?.goal.id] : null;

  return {
    id: `${category}-${candidate?.goal.id ?? 'none'}-${Date.now()}-${Math.random()}`,
    date: today,
    category,
    goalId: candidate?.goal.id ?? null,
    goalTitle: candidate?.goal.title ?? 'No goal selected',
    actionText: this.getDailyActionText(executionContext),
    sessionSize: candidate?.goal.typicalSessionSize ?? null,
    completed: false,
    surfacingScore: candidate?.score ?? null,
    surfacingReasons: candidate
      ? this.formatSurfacingReasons(candidate.reasons).slice(0, 3)
      : [],
    milestoneId: executionContext?.activeMilestoneId ?? null,
    tinyTaskId: executionContext?.nextTinyTaskId ?? null
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

  private getWeeklyRole(
    goalId: string,
    review: WeeklyReviewState | null
  ): WeeklyRole | null {
    if (!review) {
      return null;
    }

    if (review.anchorGoalIds.includes(goalId)) {
      return 'anchor';
    }

    if (review.maintenanceGoalIds.includes(goalId)) {
      return 'maintenance';
    }

    if (review.infrastructureGoalId === goalId) {
      return 'infrastructure';
    }

    if (review.creativeGoalId === goalId) {
      return 'creative';
    }

    return null;
  }

  private getWeeklyRoleCategoryAdjustment(
    weeklyRole: WeeklyRole | null,
    category: SuggestedDailyCategory | null
  ): number {
    if (!weeklyRole || !category) {
      return 0;
    }

    return this.weeklyRoleCategoryAdjustments[weeklyRole][category] ?? 0;
  }

  private getWeeklyRoleCategoryReason(
    weeklyRole: WeeklyRole | null,
    category: SuggestedDailyCategory | null,
    adjustment: number
  ): string | null {
    if (!weeklyRole || !category || adjustment <= 0) {
      return null;
    }

    switch (weeklyRole) {
      case 'anchor':
        if (category === 'momentum') return 'Weekly anchor aligned with momentum';
        if (category === 'responsible') return 'Weekly anchor aligned with responsible work';
        return null;

      case 'maintenance':
        if (category === 'maintenance') return 'Maintenance focus aligned with upkeep';
        if (category === 'fallback') return 'Maintenance focus fits a lighter touch';
        return null;

      case 'infrastructure':
        if (category === 'responsible') return 'Infrastructure focus aligned with responsible work';
        if (category === 'maintenance') return 'Infrastructure focus aligned with system upkeep';
        return null;

      case 'creative':
        if (category === 'interesting') return 'Creative focus aligned with interesting work';
        if (category === 'momentum') return 'Creative focus aligned with forward motion';
        return null;

      default:
        return null;
    }
  }

  private getAdjustedDailySurfacingResult(
    goal: Goal,
    review: WeeklyReviewState | null,
    evidenceByGoalId: Record<string, GoalBehaviorEvidence> = {}
  ): GoalSurfacingResult {
    const surfacing = this.goalSurfacingService.getSurfacingResult(
      goal,
      review,
      evidenceByGoalId[goal.id] ?? null
    );

    const weeklyRole = this.getWeeklyRole(goal.id, review);
    const adjustment = this.getWeeklyRoleCategoryAdjustment(
      weeklyRole,
      surfacing.suggestedCategory
    );

    const roleReason = this.getWeeklyRoleCategoryReason(
      weeklyRole,
      surfacing.suggestedCategory,
      adjustment
    );

    return {
      ...surfacing,
      score: surfacing.score + adjustment,
      reasons: roleReason
        ? [...surfacing.reasons, roleReason]
        : surfacing.reasons
    };
  }

  private getDailyActionText(
    executionContext: GoalExecutionContext | null
  ): string {
    if (executionContext?.nextTinyTaskTitle?.trim()) {
      return executionContext.nextTinyTaskTitle.trim();
    }

    if (executionContext?.activeMilestoneTitle?.trim()) {
      return `Add the next tiny task for milestone: ${executionContext.activeMilestoneTitle.trim()} — or mark it complete if it’s done`;
    }

    return 'Break this goal into a milestone and a tiny next step';
  }
}