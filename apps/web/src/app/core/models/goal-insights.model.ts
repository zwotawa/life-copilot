import { Goal } from './goal.model';

export interface GoalInsightBucket {
  count: number;
  goals: Goal[];
}

export interface ActiveGoalInsightItem {
  goalId: string;
  goalTitle: string;
  progressEventCount: number;
}

export interface GoalInsightsSnapshot {
  activeGoalCount: number;
  recentlyTouched: GoalInsightBucket;
  stale: GoalInsightBucket;
  untouched: GoalInsightBucket;
  noProgress: GoalInsightBucket;
  mostActiveGoals: ActiveGoalInsightItem[];
}