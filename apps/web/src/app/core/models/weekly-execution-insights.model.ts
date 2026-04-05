import { DailyCompletionSummary } from "./daily-completion.model";

export interface WeeklyExecutionInsights {
  activeDays: number;
  fullyCompletedDays: number;
  averageCompletionPercent: number;
  bestDay: DailyCompletionSummary | null;
  recentDays: DailyCompletionSummary[];
}