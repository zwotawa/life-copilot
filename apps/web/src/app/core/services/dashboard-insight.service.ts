import { Injectable } from '@angular/core';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { WeeklyInsightService } from './weekly-insights.service';
import { DashboardExecutionSnapshot } from '../models/dashboard-execution-snapshot.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardInsightService {
  constructor(
    private readonly dailyRotationStoreService: DailyRotationStoreService,
    private readonly weeklyInsightService: WeeklyInsightService
  ) {}

  public getExecutionSnapshot(): DashboardExecutionSnapshot {
    const todayKey = this.getTodayKey();
    const todaysItems = this.dailyRotationStoreService.loadRotationItemsForDate(todayKey);
    const weeklyInsights = this.weeklyInsightService.getLast7DaysInsights();

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
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}