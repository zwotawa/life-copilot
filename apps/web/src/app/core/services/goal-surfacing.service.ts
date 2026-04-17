import { Injectable } from '@angular/core';
import {
  Goal,
  GoalStatus,
  IntensityLevel,
  TouchFrequency
} from '../models/goal.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { GoalFreshnessInfo, GoalFreshnessService } from './goal-freshness.service';
import { capitalize } from 'src/app/shared/utility/capitalize';

export type SuggestedDailyCategory =
  | 'responsible'
  | 'momentum'
  | 'maintenance'
  | 'interesting'
  | 'fallback';

export interface GoalSurfacingResult {
  goalId: string;
  score: number;
  suggestedCategory: SuggestedDailyCategory | null;
  reasons: string[];
  daysSinceTouched: number | null;
  dueInDays: number | null;
}

export interface GoalBehaviorEvidence {
  progressEventCountLast7Days: number;
  hasProgressInLast14Days: boolean;
}

interface SurfacingFactors {
  statusWeight: number;
  frequencyWeight: number;
  freshnessWeight: number;
  dueWeight: number;
  weeklySelectionWeight: number;
  excitementWeight: number;
  resistancePenalty: number;
  recentMomentumWeight: number;
  noProgressWeight: number;
  overServedPenalty: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoalSurfacingService {
  constructor(private readonly goalFreshnessService: GoalFreshnessService) {}

  public getSurfacingResult(
    goal: Goal,
    review: WeeklyReviewState | null,
    evidence?: GoalBehaviorEvidence | null
  ): GoalSurfacingResult {
    const reasons: string[] = [];

    const freshness = this.goalFreshnessService.getFreshnessInfo(goal);
    const daysSinceTouched = freshness.daysSinceTouched;
    const dueInDays = this.getDueInDays(goal);

    const factors = this.buildFactors(goal, review, freshness, dueInDays, evidence ?? null);
    const score = this.calculateScore(factors);

    this.addBaseReasons(reasons, goal, review, freshness, dueInDays, factors);
    this.addEvidenceReasons(reasons, evidence ?? null, factors);

    return {
      goalId: goal.id,
      score,
      suggestedCategory: this.getSuggestedDailyCategory(goal, review, dueInDays),
      reasons,
      daysSinceTouched,
      dueInDays
    };
  }

  public getSurfacingScore(
    goal: Goal,
    review: WeeklyReviewState | null,
    evidence?: GoalBehaviorEvidence | null
  ): number {
    return this.getSurfacingResult(goal, review, evidence).score;
  }

  public sortGoalsBySurfacing(
    goals: Goal[],
    review: WeeklyReviewState | null,
    evidenceByGoalId?: Record<string, GoalBehaviorEvidence>
  ): Goal[] {
    return goals
      .slice()
      .sort((a, b) => {
        const aEvidence = evidenceByGoalId?.[a.id] ?? null;
        const bEvidence = evidenceByGoalId?.[b.id] ?? null;

        const scoreDiff =
          this.getSurfacingScore(b, review, bEvidence) -
          this.getSurfacingScore(a, review, aEvidence);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        const aDue = this.getDueInDays(a);
        const bDue = this.getDueInDays(b);

        if (aDue !== null && bDue !== null && aDue !== bDue) {
          return aDue - bDue;
        }

        return a.title.localeCompare(b.title);
      });
  }

  public getSuggestedDailyCategory(
    goal: Goal,
    review: WeeklyReviewState | null,
    dueInDays?: number | null
  ): SuggestedDailyCategory | null {
    if (goal.status !== 'active') {
      return null;
    }

    const computedDueInDays =
      dueInDays === undefined ? this.getDueInDays(goal) : dueInDays;

    if (
      goal.dueStyle === 'hard_date' ||
      (goal.dueStyle === 'target_window' &&
        computedDueInDays !== null &&
        computedDueInDays <= 14)
    ) {
      return 'responsible';
    }

    if (goal.type === 'maintain') {
      return 'maintenance';
    }

    if (goal.type === 'exploration') {
      return 'interesting';
    }

    if (review?.anchorGoalIds.includes(goal.id)) {
      return 'momentum';
    }

    if (goal.typicalSessionSize === '5m' || goal.typicalSessionSize === '10m') {
      return 'fallback';
    }

    return 'momentum';
  }

  public isSuggestedToday(
    goal: Goal,
    review: WeeklyReviewState | null,
    evidence?: GoalBehaviorEvidence | null
  ): boolean {
    if (goal.status !== 'active') {
      return false;
    }

    if (review?.anchorGoalIds.includes(goal.id)) {
      return true;
    }

    return this.getSurfacingScore(goal, review, evidence) >= 28;
  }

  private buildFactors(
    goal: Goal,
    review: WeeklyReviewState | null,
    freshness: GoalFreshnessInfo,
    dueInDays: number | null,
    evidence: GoalBehaviorEvidence | null
  ): SurfacingFactors {
    return {
      statusWeight: this.getStatusWeight(goal.status),
      frequencyWeight: this.getFrequencyWeight(goal.minimumTouchFrequency),
      freshnessWeight: this.getFreshnessWeight(freshness),
      dueWeight: this.getDueWeight(dueInDays),
      weeklySelectionWeight: this.getWeeklySelectionWeight(goal, review),
      excitementWeight: this.getExcitementWeight(goal.excitement),
      resistancePenalty: this.getResistancePenalty(goal.resistance),
      recentMomentumWeight: this.getRecentMomentumWeight(evidence),
      noProgressWeight: this.getNoProgressWeight(evidence),
      overServedPenalty: this.getOverServedPenalty(evidence)
    };
  }

  private calculateScore(factors: SurfacingFactors): number {
    const score =
      factors.statusWeight +
      factors.frequencyWeight +
      factors.freshnessWeight +
      factors.dueWeight +
      factors.weeklySelectionWeight +
      factors.excitementWeight +
      factors.recentMomentumWeight +
      factors.noProgressWeight -
      factors.resistancePenalty -
      factors.overServedPenalty;

    return Math.max(0, score);
  }

  private addBaseReasons(
    reasons: string[],
    goal: Goal,
    review: WeeklyReviewState | null,
    freshness: GoalFreshnessInfo,
    dueInDays: number | null,
    factors: SurfacingFactors
  ): void {
    if (factors.statusWeight !== 0) {
      reasons.push(`${capitalize(goal.status)} goal`);
    }

    if (factors.frequencyWeight !== 0) {
      reasons.push(`${this.goalFreshnessService.getTouchFrequencyLabel(goal.minimumTouchFrequency)} rhythm`);
    }

    const freshnessReason = this.getFreshnessReason(freshness);
    if (freshnessReason) {
      reasons.push(freshnessReason);
    }

    if (factors.dueWeight !== 0) {
      reasons.push('Due soon');
    }

    if (factors.weeklySelectionWeight !== 0) {
      reasons.push('Chosen in weekly review');
    }

    if (factors.excitementWeight !== 0) {
      reasons.push('High interest');
    }

    if (factors.resistancePenalty !== 0) {
      reasons.push('Higher resistance');
    }
  }

  private addEvidenceReasons(
    reasons: string[],
    evidence: GoalBehaviorEvidence | null,
    factors: SurfacingFactors
  ): void {
    if (!evidence) {
      return;
    }

    if (factors.recentMomentumWeight > 0) {
      reasons.push('Recent progress momentum');
    }

    if (factors.noProgressWeight > 0) {
      reasons.push('No progress recorded in 14 days');
    }

    if (factors.overServedPenalty > 0) {
      reasons.push('Already receiving strong recent attention');
    }
  }

  private getRecentMomentumWeight(evidence: GoalBehaviorEvidence | null): number {
    if (!evidence) {
      return 0;
    }

    const count = evidence.progressEventCountLast7Days;

    if (count <= 0) return 0;
    if (count === 1) return 2;
    if (count === 2) return 4;
    return 5;
  }

  private getNoProgressWeight(evidence: GoalBehaviorEvidence | null): number {
    if (!evidence) {
      return 0;
    }

    return evidence.hasProgressInLast14Days ? 0 : 6;
  }

  private getOverServedPenalty(evidence: GoalBehaviorEvidence | null): number {
    if (!evidence) {
      return 0;
    }

    const count = evidence.progressEventCountLast7Days;

    if (count >= 6) return 5;
    if (count >= 4) return 3;

    return 0;
  }

  private getStatusWeight(status: GoalStatus): number {
    switch (status) {
      case 'active':
        return 10;
      case 'paused':
        return -8;
      case 'someday':
        return -12;
      case 'completed':
      case 'archived':
        return -20;
      default:
        return 0;
    }
  }

  private getFrequencyWeight(frequency: TouchFrequency): number {
    switch (frequency) {
      case 'daily':
        return 10;
      case '3x_week':
        return 8;
      case 'weekly':
        return 6;
      case 'biweekly':
        return 4;
      case 'monthly':
        return 2;
      case 'seasonal':
        return 1;
      default:
        return 0;
    }
  }

  private getDueWeight(dueInDays: number | null): number {
    if (dueInDays === null) {
      return 0;
    }

    if (dueInDays < 0) return 20;
    if (dueInDays <= 3) return 16;
    if (dueInDays <= 7) return 12;
    if (dueInDays <= 14) return 8;
    if (dueInDays <= 30) return 4;

    return 0;
  }

  private getWeeklySelectionWeight(
    goal: Goal,
    review: WeeklyReviewState | null
  ): number {
    if (!review) {
      return 0;
    }

    if (review.anchorGoalIds.includes(goal.id)) {
      return 12;
    }

    if (review.infrastructureGoalId === goal.id) {
      return 6;
    }

    if (review.creativeGoalId === goal.id) {
      return 5;
    }

    if (review.maintenanceGoalIds.includes(goal.id)) {
      return 4;
    }

    return 0;
  }

  private getExcitementWeight(excitement?: IntensityLevel): number {
    switch (excitement) {
      case 'high':
        return 4;
      case 'medium':
        return 2;
      default:
        return 0;
    }
  }

  private getResistancePenalty(resistance?: IntensityLevel): number {
    switch (resistance) {
      case 'high':
        return 4;
      case 'medium':
        return 2;
      default:
        return 0;
    }
  }

  private getDueInDays(goal: Goal): number | null {
    let dateString: string | null | undefined = null;

    if (goal.dueStyle === 'hard_date') {
      dateString = goal.realDeadline;
    } else if (goal.dueStyle === 'target_window') {
      dateString = goal.targetDate;
    }

    if (!dateString) {
      return null;
    }

    const dueDate = new Date(dateString);
    if (Number.isNaN(dueDate.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();

    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  private getFreshnessWeight(freshness: GoalFreshnessInfo): number {
    if (freshness.daysSinceTouched === null) {
      return 6;
    }

    if (freshness.isOverRhythm) {
      return 12;
    }

    if (freshness.daysSinceTouched === 0) {
      return 0;
    }

    if (freshness.daysSinceTouched === 1) {
      return 1;
    }

    if (freshness.daysSinceTouched >= 14) {
      return 10;
    }

    if (freshness.daysSinceTouched >= 7) {
      return 6;
    }

    if (freshness.daysSinceTouched >= 3) {
      return 3;
    }

    return 1;
  }

  private getFreshnessReason(freshness: GoalFreshnessInfo): string | null {
    if (freshness.daysSinceTouched === null) {
      return 'No touch recorded yet';
    }

    if (freshness.isOverRhythm) {
      return freshness.label;
    }

    if (freshness.daysSinceTouched >= 7) {
      return freshness.label;
    }

    return null;
  }
}