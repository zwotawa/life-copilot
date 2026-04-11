import { Injectable } from '@angular/core';
import { DailyCompletionSummary } from '../models/daily-completion.model';
import { DailyCompletionHistoryStoreService } from './daily-completion-history-store.service';
import { WeeklyExecutionInsights } from '../models/weekly-execution-insights.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeeklyInsightService {
  constructor(
    private readonly dailyCompletionHistoryStoreService: DailyCompletionHistoryStoreService
  ) {}

  public getLast7DaysInsights(): Observable<WeeklyExecutionInsights> {
    return this.dailyCompletionHistoryStoreService.getSummaries().pipe(
      map(summaries => {
        const recentDays = this.getMostRecentDays(summaries, 7);

        const activeDays = recentDays.filter(day => day.completedCount > 0).length;
        const fullyCompletedDays = recentDays.filter(day => day.fullyCompleted).length;

        const averageCompletionPercent =
          recentDays.length === 0
            ? 0
            : Math.round(
                recentDays.reduce((sum, day) => sum + day.completionPercent, 0) /
                  recentDays.length
              );

        const bestDay =
          recentDays.length === 0
            ? null
            : [...recentDays].sort(
                (a, b) => b.completionPercent - a.completionPercent
              )[0];

        return {
          activeDays,
          fullyCompletedDays,
          averageCompletionPercent,
          bestDay,
          recentDays
        };
      })
    );
  }

  private getMostRecentDays(
    summaries: DailyCompletionSummary[],
    count: number
  ): DailyCompletionSummary[] {
    return [...summaries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, count);
  }
}