import { Injectable } from '@angular/core';

export interface GoalFreshnessInfo {
  label: string;
  shortLabel: string;
  tone: 'fresh' | 'neutral' | 'stale' | 'overdue' | 'unknown';
  daysSinceTouch: number | null;
  isOverRhythm: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoalFreshnessService {
  getFreshnessInfo(
    lastTouchedAt?: string | null,
    minimumTouchFrequency?: number | null
  ): GoalFreshnessInfo {
    if (!lastTouchedAt) {
      return {
        label: 'No touch recorded',
        shortLabel: 'No touch',
        tone: 'unknown',
        daysSinceTouch: null,
        isOverRhythm: false
      };
    }

    const touched = new Date(lastTouchedAt);
    const now = new Date();

    const touchedStart = new Date(
      touched.getFullYear(),
      touched.getMonth(),
      touched.getDate()
    );
    const nowStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const diffMs = nowStart.getTime() - touchedStart.getTime();
    const daysSinceTouch = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let label = '';
    let shortLabel = '';
    let tone: GoalFreshnessInfo['tone'] = 'neutral';

    if (daysSinceTouch === 0) {
      label = 'Touched today';
      shortLabel = 'Today';
      tone = 'fresh';
    } else if (daysSinceTouch === 1) {
      label = 'Touched yesterday';
      shortLabel = 'Yesterday';
      tone = 'fresh';
    } else {
      label = `Not touched in ${daysSinceTouch} days`;
      shortLabel = `${daysSinceTouch}d ago`;
      tone = 'neutral';
    }

    const isOverRhythm =
      !!minimumTouchFrequency &&
      minimumTouchFrequency > 0 &&
      daysSinceTouch > minimumTouchFrequency;

    if (isOverRhythm) {
      label = 'Over weekly rhythm';
      shortLabel = 'Over rhythm';
      tone = 'overdue';
    } else if (daysSinceTouch >= 7) {
      tone = 'stale';
    }

    return {
      label,
      shortLabel,
      tone,
      daysSinceTouch,
      isOverRhythm
    };
  }
}