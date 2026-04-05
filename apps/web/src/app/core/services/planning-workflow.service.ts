import { Injectable } from '@angular/core';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { GoalStoreService } from './goal-store.service';
import { WeeklyReviewStoreService } from './weekly-review-store.service';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { Goal } from '../models/goal.model';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { RotationEngineService } from './rotation-engine.service';
import { DailyCompletionHistoryStoreService } from './daily-completion-history-store.service';

@Injectable({
  providedIn: 'root'
})
export class PlanningWorkflowService {

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private dailyRotationStoreService: DailyRotationStoreService,
    private rotationEngineService: RotationEngineService,
    private dailyCompletionHistoryStoreService: DailyCompletionHistoryStoreService
  ) { }

  public getOrCreateDailyRotation(): DailyRotationItem[] {
    const today = this.getTodayKey();
    const saved: DailyRotationItem[] = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    if(saved.length > 0) {
      return saved;
    }

    const todayPlan = this.resetTodayPlan();
    this.saveDailyCompletionSummary(todayPlan);
    
    return todayPlan;
  }



  private regenerateDailyRotation(): DailyRotationItem[] {
    const today = this.getTodayKey();
    const goals: Goal[] = this.goalStoreService.getGoals();
    const weeklyReview: WeeklyReviewState = this.weeklyReviewStoreService.getCurrentWeeklyReview();

    const newRotationItems = this.dailyRotationStoreService.generateDailyRotationForDate(today, goals, weeklyReview);
    this.saveDailyCompletionSummary(newRotationItems);
    return newRotationItems;
  }


  //wrapper functions for wording clarity
  public refreshTodayPlan(): DailyRotationItem[] {
    return this.regenerateDailyRotationPreservingCompleted();
  }

  private resetTodayPlan(): DailyRotationItem[] {
    return this.regenerateDailyRotation();
  }

  private regenerateDailyRotationPreservingCompleted(): DailyRotationItem[] {
    const today = this.getTodayKey();
    const currentItems = this.dailyRotationStoreService.loadRotationItemsForDate(today);

    if (currentItems.length === 0) {
      return this.resetTodayPlan();
    }

    const freshItems = this.buildFreshRotationCandidates();

    const usedGoalIds = new Set(
      currentItems
        .filter(item => item.completed && item.goalId)
        .map(item => item.goalId as string)
    );

    const updatedItems = currentItems.map(currentItem => {
      if (currentItem.completed) {
        return currentItem;
      }

      const replacement = this.pickReplacementForCategory(
        currentItem,
        freshItems,
        usedGoalIds,
        today
      );

      if (!replacement) {
        return currentItem;
      }

      if (replacement.goalId) {
        usedGoalIds.add(replacement.goalId);
      }

      return replacement;
    });

    this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems);
    this.saveDailyCompletionSummary(updatedItems);
    return updatedItems;
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
    this.saveDailyCompletionSummary(updatedItems);

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

  public getLastSevenDaysCompletions(): number {
    const completionHistory = this.dailyCompletionHistoryStoreService.getSummaries();
    let daysWithCompletions = 0;

    completionHistory.map(summary => {
      if(this.isWithinPast7Days(summary.date) && summary.completionPercent > 0) daysWithCompletions += 1;
    })

    return daysWithCompletions;
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

    const freshItems = this.buildFreshRotationCandidates();

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
    this.saveDailyCompletionSummary(updatedItems);
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

  private pickReplacementForCategory(
  currentItem: DailyRotationItem,
  freshItems: DailyRotationItem[],
  usedGoalIds: Set<string>,
  today: string
): DailyRotationItem | null {
  const sameCategoryCandidates = freshItems.filter(
    item => item.category === currentItem.category
  );

  const preferred = sameCategoryCandidates.find(candidate => {
    const hasGoalId = !!candidate.goalId;
    const isSameGoal = hasGoalId && candidate.goalId === currentItem.goalId;
    const isAlreadyUsed = hasGoalId && usedGoalIds.has(candidate.goalId!);

    return !isSameGoal && !isAlreadyUsed;
  });

  const fallback = sameCategoryCandidates.find(candidate => {
    const hasGoalId = !!candidate.goalId;
    const isAlreadyUsed = hasGoalId && usedGoalIds.has(candidate.goalId!);

    return !isAlreadyUsed;
  });

  const chosen = preferred ?? fallback ?? sameCategoryCandidates[0] ?? null;

  if (!chosen) {
    return null;
  }

  return {
    ...chosen,
    id: currentItem.id,
    date: today,
    completed: false
  };
}

private buildFreshRotationCandidates(): DailyRotationItem[] {
  const goals = this.goalStoreService.getGoals();
  const review = this.weeklyReviewStoreService.getCurrentWeeklyReview();
  return this.rotationEngineService.generateDailyRotation(goals, review);
}

private saveDailyCompletionSummary(items: DailyRotationItem[]): void {
  const totalCount = items.length;
  const completedCount = items.filter(item => item.completed).length;
  const completionPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  this.dailyCompletionHistoryStoreService.saveSummary({
    date: this.getTodayKey(),
    completedCount,
    totalCount,
    completionPercent,
    fullyCompleted: totalCount > 0 && completedCount === totalCount
  });
}

private isWithinPast7Days(dateString: string): boolean {
  const inputDate = new Date(dateString);
  const now = new Date();
  
  // Calculate difference in milliseconds
  const diffInMs = now.getTime() - inputDate.getTime();
  
  // Convert to days (1000ms * 60s * 60m * 24h = 86,400,000)
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  // Return true if between 0 and 7 days ago
  return diffInDays >= 0 && diffInDays <= 7;
}


}
