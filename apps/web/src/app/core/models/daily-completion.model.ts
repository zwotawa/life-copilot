export interface DailyCompletionSummary {
  date: string;
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  fullyCompleted: boolean;
}