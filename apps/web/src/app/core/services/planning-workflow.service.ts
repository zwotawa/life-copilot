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

  public setRotationItemCompleted(
    itemId: string,
    completed: boolean
  ): DailyRotationItem[] {
    const today = this.getTodayKey();
    const items = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    const target = items.find(item => item.id === itemId);
    if (!target) {
      return items;
    }

    const wasCompleted = target.completed;

    const updatedItems = items.map(item =>
      item.id === itemId
        ? { ...item, completed }
        : item
    );

    this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems);

    if (!wasCompleted && completed && target.goalId) {
      this.goalStoreService.markGoalTouched(target.goalId);
    }

    return updatedItems;
  }

  public toggleRotationItemCompleted(itemId: string): DailyRotationItem[] {
    const today = this.getTodayKey();
    const items = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    const target = items.find(item => item.id === itemId);
    if (!target) {
      return items;
    }

    return this.setRotationItemCompleted(itemId, !target.completed);
  }
  

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
