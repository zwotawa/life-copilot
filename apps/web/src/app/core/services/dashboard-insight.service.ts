import { Injectable } from '@angular/core';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { WeeklyInsightService } from './weekly-insights.service';
import { DashboardExecutionSnapshot } from '../models/dashboard-execution-snapshot.model';
import { combineLatest, map, Observable } from 'rxjs';
import { get } from 'http';
import { getLocalDateKey } from 'src/app/shared/utility/get-today-key';

@Injectable({
  providedIn: 'root'
})
export class DashboardInsightService {
  constructor(
    private readonly dailyRotationStoreService: DailyRotationStoreService,
    private readonly weeklyInsightService: WeeklyInsightService
  ) {}

  public getExecutionSnapshot(): Observable<DashboardExecutionSnapshot> {
    const todayKey = this.getTodayKey();
    return combineLatest([
      this.dailyRotationStoreService.loadRotationItemsForDate(todayKey),
      this.weeklyInsightService.getLast7DaysInsights()
    ]).pipe(
      map(([todaysItems, weeklyInsights]) => {
        const todayCompletedCount = todaysItems.filter(item => item.completed).length;
        const todayTotalCount = todaysItems.length;
        const todayCompletionPercent =
          todayTotalCount === 0
          ? 0
          : Math.round((todayCompletedCount / todayTotalCount) * 100);

        return {
          todayCompletedCount,
          todayTotalCount,
          todayCompletionPercent,
          activeDaysLast7: weeklyInsights.activeDays,
          averageCompletionPercentLast7: weeklyInsights.averageCompletionPercent,
          fullyCompletedDaysLast7: weeklyInsights.fullyCompletedDays
        };
      })
    )
  }

  private getTodayKey(): string {
    return getLocalDateKey();
  }
}