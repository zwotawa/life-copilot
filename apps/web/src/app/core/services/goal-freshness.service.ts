import { Injectable } from '@angular/core';
import { Goal, TouchFrequency } from '../models/goal.model';

export type GoalFreshnessTone =
  | 'fresh'
  | 'neutral'
  | 'stale'
  | 'overdue'
  | 'unknown';

export interface GoalFreshnessInfo {
  label: string;
  shortLabel: string;
  tone: GoalFreshnessTone;
  daysSinceTouched: number | null;
  expectedTouchDays: number | null;
  isOverRhythm: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoalFreshnessService {
  public getDaysSinceTouched(lastTouchedAt?: string | null): number | null {
    if (!lastTouchedAt) {
      return null;
    }

    const touched = new Date(lastTouchedAt);
    const today = new Date();

    const touchedStart = new Date(
      touched.getFullYear(),
      touched.getMonth(),
      touched.getDate()
    );

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffMs = todayStart.getTime() - touchedStart.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  public getExpectedTouchDays(frequency?: TouchFrequency | null): number | null {
    switch (frequency) {
      case 'daily':
        return 1;
      case '3x_week':
        return 3;
      case 'weekly':
        return 7;
      case 'biweekly':
        return 14;
      case 'monthly':
        return 30;
      case 'seasonal':
        return 90;
      default:
        return null;
    }
  }

  public getTouchFrequencyLabel(frequency?: TouchFrequency | null): string {
    switch (frequency) {
      case 'daily':
        return 'daily';
      case '3x_week':
        return '3x/week';
      case 'weekly':
        return 'weekly';
      case 'biweekly':
        return 'biweekly';
      case 'monthly':
        return 'monthly';
      case 'seasonal':
        return 'seasonal';
      default:
        return 'planned';
    }
  }

  public isOverRhythm(goal: Goal): boolean {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);
    const expectedTouchDays = this.getExpectedTouchDays(goal.minimumTouchFrequency);

    return (
      daysSinceTouched !== null &&
      expectedTouchDays !== null &&
      daysSinceTouched > expectedTouchDays
    );
  }

  public getLabel(goal: Goal): string {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);

    if (daysSinceTouched === null) {
      return 'No touch recorded';
    }

    if (daysSinceTouched === 0) {
      return 'Touched today';
    }

    if (daysSinceTouched === 1) {
      return 'Touched yesterday';
    }

    if (this.isOverRhythm(goal)) {
      return `Over ${this.getTouchFrequencyLabel(goal.minimumTouchFrequency)} rhythm`;
    }

    return `Not touched in ${daysSinceTouched} day${daysSinceTouched === 1 ? '' : 's'}`;
  }

  public getShortLabel(goal: Goal): string {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);

    if (daysSinceTouched === null) {
      return 'No touch';
    }

    if (daysSinceTouched === 0) {
      return 'Today';
    }

    if (daysSinceTouched === 1) {
      return 'Yesterday';
    }

    if (this.isOverRhythm(goal)) {
      return 'Over rhythm';
    }

    return `${daysSinceTouched}d ago`;
  }

  public getTone(goal: Goal): GoalFreshnessTone {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);

    if (daysSinceTouched === null) {
      return 'unknown';
    }

    if (this.isOverRhythm(goal)) {
      return 'overdue';
    }

    if (daysSinceTouched <= 1) {
      return 'fresh';
    }

    if (daysSinceTouched >= 7) {
      return 'stale';
    }

    return 'neutral';
  }

  public getFreshnessInfo(goal: Goal): GoalFreshnessInfo {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);
    const expectedTouchDays = this.getExpectedTouchDays(goal.minimumTouchFrequency);
    const isOverRhythm = this.isOverRhythm(goal);

    return {
      label: this.getLabel(goal),
      shortLabel: this.getShortLabel(goal),
      tone: this.getTone(goal),
      daysSinceTouched,
      expectedTouchDays,
      isOverRhythm
    };
  }
}