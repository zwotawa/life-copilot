import { Injectable } from '@angular/core';
import {
  Goal,
  GoalStatus,
  GoalType,
  IntensityLevel,
  TouchFrequency
} from '../models/goal.model';
import { WeeklyReviewState } from '../models/weekly-review.model';

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

@Injectable({
  providedIn: 'root'
})
export class GoalSurfacingService {
  public getSurfacingResult(
    goal: Goal,
    review: WeeklyReviewState | null
  ): GoalSurfacingResult {
    const reasons: string[] = [];

    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);
    const dueInDays = this.getDueInDays(goal);

    let score = 0;

    const statusWeight = this.getStatusWeight(goal.status);
    score += statusWeight;
    if (statusWeight !== 0) {
      reasons.push(`status ${goal.status}: ${statusWeight >= 0 ? '+' : ''}${statusWeight}`);
    }

    const touchWeight = this.getFrequencyWeight(goal.minimumTouchFrequency);
    score += touchWeight;
    if (touchWeight !== 0) {
      reasons.push(`touch frequency: +${touchWeight}`);
    }

    const staleWeight = this.getStalenessWeight(daysSinceTouched);
    score += staleWeight;
    if (staleWeight !== 0) {
      reasons.push(`staleness: +${staleWeight}`);
    }

    const dueWeight = this.getDueWeight(dueInDays);
    score += dueWeight;
    if (dueWeight !== 0) {
      reasons.push(`due timing: +${dueWeight}`);
    }

    const anchorWeight = this.getWeeklySelectionWeight(goal, review);
    score += anchorWeight;
    if (anchorWeight !== 0) {
      reasons.push(`weekly role: +${anchorWeight}`);
    }

    const excitementWeight = this.getExcitementWeight(goal.excitement);
    score += excitementWeight;
    if (excitementWeight !== 0) {
      reasons.push(`excitement: +${excitementWeight}`);
    }

    const resistancePenalty = this.getResistancePenalty(goal.resistance);
    score -= resistancePenalty;
    if (resistancePenalty !== 0) {
      reasons.push(`resistance: -${resistancePenalty}`);
    }

    score = Math.max(0, score);

    return {
      goalId: goal.id,
      score,
      suggestedCategory: this.getSuggestedDailyCategory(goal, review, dueInDays),
      reasons,
      daysSinceTouched,
      dueInDays
    };
  }

  public getSurfacingScore(goal: Goal, review: WeeklyReviewState | null): number {
    return this.getSurfacingResult(goal, review).score;
  }

  public sortGoalsBySurfacing(
    goals: Goal[],
    review: WeeklyReviewState | null
  ): Goal[] {
    return goals
      .slice()
      .sort((a, b) => {
        const scoreDiff =
          this.getSurfacingScore(b, review) - this.getSurfacingScore(a, review);

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

  public isSuggestedToday(goal: Goal, review: WeeklyReviewState | null): boolean {
    if (goal.status !== 'active') {
      return false;
    }

    if (review?.anchorGoalIds.includes(goal.id)) {
      return true;
    }

    return this.getSurfacingScore(goal, review) >= 28;
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
        return -20;
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

  private getStalenessWeight(daysSinceTouched: number | null): number {
    if (daysSinceTouched === null) {
      return 4;
    }

    return Math.min(14, Math.round(daysSinceTouched / 2));
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

  private getDaysSinceTouched(lastTouchedAt?: string | null): number | null {
    if (!lastTouchedAt) {
      return null;
    }

    const touchedDate = new Date(lastTouchedAt);
    if (Number.isNaN(touchedDate.getTime())) {
      return null;
    }

    const now = new Date();
    const diffMs = now.getTime() - touchedDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
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
}