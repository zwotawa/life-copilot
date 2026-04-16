import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalInsightsSnapshot } from '../models/goal-insights.model';

@Injectable({
  providedIn: 'root'
})
export class GoalInsightsService {
  public getSnapshot(goals: Goal[]): GoalInsightsSnapshot {
    const activeGoals = goals.filter(goal => goal.status === 'active');

    const recentlyTouchedGoals = activeGoals.filter(goal =>
      this.wasTouchedWithinDays(goal, 7)
    );

    const staleGoals = activeGoals.filter(goal =>
      !goal.lastTouchedAt || this.wasTouchedMoreThanDaysAgo(goal, 7)
    );

    const untouchedGoals = activeGoals.filter(goal => !goal.lastTouchedAt);

    return {
      activeGoalCount: activeGoals.length,
      recentlyTouched: {
        count: recentlyTouchedGoals.length,
        goals: recentlyTouchedGoals.slice(0, 5)
      },
      stale: {
        count: staleGoals.length,
        goals: staleGoals.slice(0, 5)
      },
      untouched: {
        count: untouchedGoals.length,
        goals: untouchedGoals.slice(0, 5)
      }
    };
  }

  private wasTouchedWithinDays(goal: Goal, days: number): boolean {
    if (!goal.lastTouchedAt) {
      return false;
    }

    const lastTouched = new Date(goal.lastTouchedAt);
    if (Number.isNaN(lastTouched.getTime())) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - lastTouched.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= days;
  }

  private wasTouchedMoreThanDaysAgo(goal: Goal, days: number): boolean {
    if (!goal.lastTouchedAt) {
      return true;
    }

    const lastTouched = new Date(goal.lastTouchedAt);
    if (Number.isNaN(lastTouched.getTime())) {
      return true;
    }

    const now = new Date();
    const diffMs = now.getTime() - lastTouched.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > days;
  }
}