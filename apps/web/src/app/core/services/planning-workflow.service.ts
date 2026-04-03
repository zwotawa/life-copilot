import { Injectable } from '@angular/core';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { GoalStoreService } from './goal-store.service';
import { WeeklyReviewStoreService } from './weekly-review-store.service';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { Goal } from '../models/goal.model';
import { WeeklyReviewState } from '../models/weekly-review.model';

@Injectable({
  providedIn: 'root'
})
export class PlanningWorkflowService {

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private dailyRotationStoreService: DailyRotationStoreService
  ) { }

  public getOrCreateDailyRotation(): DailyRotationItem[] {
    const today = this.getTodayKey();
    const saved: DailyRotationItem[] = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    if(saved.length > 0) {
      return saved;
    }

    return this.regenerateDailyRotation();
  }

  public regenerateDailyRotation(): DailyRotationItem[] {
    const today = this.getTodayKey();
    const goals: Goal[] = this.goalStoreService.getGoals();
    const weeklyReview: WeeklyReviewState = this.weeklyReviewStoreService.getCurrentWeeklyReview();

    return this.dailyRotationStoreService.generateDailyRotationForDate(today, goals, weeklyReview);
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
