import { Goal } from './goal.model';

export interface GoalInsightBucket {
  count: number;
  goals: Goal[];
}

export interface GoalInsightsSnapshot {
  activeGoalCount: number;
  recentlyTouched: GoalInsightBucket;
  stale: GoalInsightBucket;
  untouched: GoalInsightBucket;
}