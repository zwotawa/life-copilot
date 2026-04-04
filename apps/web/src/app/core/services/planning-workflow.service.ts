import { Injectable } from '@angular/core';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { GoalStoreService } from './goal-store.service';
import { WeeklyReviewStoreService } from './weekly-review-store.service';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { Goal } from '../models/goal.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { RotationEngineService } from './rotation-engine.service';

@Injectable({
  providedIn: 'root'
})
export class PlanningWorkflowService {

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private dailyRotationStoreService: DailyRotationStoreService,
    private rotationEngineService: RotationEngineService
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

   public replaceRotationItem(itemId: string): DailyRotationItem[] {
    const today = this.getTodayKey();
    const currentItems = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    const itemToReplace = currentItems.find(item => item.id === itemId);
    if (!itemToReplace) {
      return currentItems;
    }

    const goals = this.goalStoreService.getGoals();
    const review = this.weeklyReviewStoreService.getCurrentWeeklyReview();

    const freshItems = this.rotationEngineService.generateDailyRotation(goals, review);

    const replacement = this.pickReplacementCandidate(
      itemToReplace,
      currentItems,
      freshItems,
      today
    );

    if (!replacement) {
      return currentItems;
    }

    const updatedItems = currentItems.map(item =>
      item.id === itemId ? replacement : item
    );

    this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems);
    return updatedItems;
  }

  private pickReplacementCandidate(
    itemToReplace: DailyRotationItem,
    currentItems: DailyRotationItem[],
    freshItems: DailyRotationItem[],
    today: string
  ): DailyRotationItem | null {
    const sameCategoryCandidates = freshItems.filter(
      item => item.category === itemToReplace.category
    );

    const usedGoalIds = new Set(
      currentItems
        .filter(item => item.id !== itemToReplace.id)
        .map(item => item.goalId)
        .filter((goalId): goalId is string => !!goalId)
    );

    const nonDuplicateCandidate = sameCategoryCandidates.find(candidate => {
      const isSameGoal = candidate.goalId && candidate.goalId === itemToReplace.goalId;
      const isUsedElsewhere = candidate.goalId ? usedGoalIds.has(candidate.goalId) : false;

      return !isSameGoal && !isUsedElsewhere;
    });

    const chosen = nonDuplicateCandidate ?? sameCategoryCandidates[0] ?? null;

    if (!chosen) {
      return null;
    }

    return {
      ...chosen,
      id: itemToReplace.id,
      date: today,
      completed: false
    };
  }
}
