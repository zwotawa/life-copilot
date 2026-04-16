import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalInsightsSnapshot, ActiveGoalInsightItem } from '../models/goal-insights.model';
import { GoalProgressEvent } from '../models/goal-progress-event.model';

@Injectable({
  providedIn: 'root'
})
export class GoalInsightsService {
  public getSnapshot(
    goals: Goal[],
    progressEvents: GoalProgressEvent[] = []
  ): GoalInsightsSnapshot {
    const activeGoals = goals.filter(goal => goal.status === 'active');

    const recentlyTouchedGoals = activeGoals.filter(goal =>
      this.wasTouchedWithinDays(goal, 7)
    );

    const staleGoals = activeGoals.filter(goal =>
      !goal.lastTouchedAt || this.wasTouchedMoreThanDaysAgo(goal, 7)
    );

    const untouchedGoals = activeGoals.filter(goal => !goal.lastTouchedAt);

    const recentProgressEvents = progressEvents.filter(event =>
      this.wasCreatedWithinDays(event.createdAt, 7)
    );

    const recentProgressEventsLast14Days = progressEvents.filter(event =>
      this.wasCreatedWithinDays(event.createdAt, 14)
    );

    const progressCountByGoalId = new Map<string, number>();

    for (const event of recentProgressEvents) {
      if (!event.goalId) {
        continue;
      }

      const currentCount = progressCountByGoalId.get(event.goalId) ?? 0;
      progressCountByGoalId.set(event.goalId, currentCount + 1);
    }

    const mostActiveGoals: ActiveGoalInsightItem[] = activeGoals
      .map(goal => ({
        goalId: goal.id,
        goalTitle: goal.title,
        progressEventCount: progressCountByGoalId.get(goal.id) ?? 0
      }))
      .filter(item => item.progressEventCount > 0)
      .sort((a, b) => b.progressEventCount - a.progressEventCount)
      .slice(0, 5);

    const recentProgressGoalIdsLast14Days = new Set(
      recentProgressEventsLast14Days
        .map(event => event.goalId)
        .filter((goalId): goalId is string => !!goalId)
    );

    const noProgressGoals = activeGoals.filter(goal =>
      !recentProgressGoalIdsLast14Days.has(goal.id)
    );

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
      },
      noProgress: {
        count: noProgressGoals.length,
        goals: noProgressGoals.slice(0, 5)
      },
      mostActiveGoals
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

  private wasCreatedWithinDays(createdAt: string, days: number): boolean {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays <= days;
  }
}