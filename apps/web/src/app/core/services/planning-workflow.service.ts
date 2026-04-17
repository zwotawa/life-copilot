import { Injectable } from '@angular/core';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { GoalStoreService } from './goal-store.service';
import { WeeklyReviewStoreService } from './weekly-review-store.service';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { RotationEngineService } from './rotation-engine.service';
import { DailyCompletionHistoryStoreService } from './daily-completion-history-store.service';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { GoalProgressStoreService } from './goal-progress-store.service';
import { GoalInsightsService } from './goal-insights.service';

@Injectable({
  providedIn: 'root'
})
export class PlanningWorkflowService {

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private dailyRotationStoreService: DailyRotationStoreService,
    private rotationEngineService: RotationEngineService,
    private dailyCompletionHistoryStoreService: DailyCompletionHistoryStoreService,
    private goalProgressStoreService: GoalProgressStoreService,
    private goalInsightsService: GoalInsightsService
  ) { }

  public getOrCreateDailyRotation(): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();

    return this.dailyRotationStoreService.loadRotationItemsForDate(today).pipe(
      switchMap(todayRotation => {
        
        if(todayRotation.length > 0) {
          return of(todayRotation);
        }

        return this.resetTodayPlan().pipe(
          switchMap((todayPlan: DailyRotationItem[]) => {
            return this.saveDailyCompletionSummary(todayPlan).pipe(
              map(() => todayPlan)
            );
          })
        );
      })
    );
  }



  private regenerateDailyRotation(): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();

    return combineLatest([
      this.goalStoreService.getGoals(),
      this.weeklyReviewStoreService.getCurrentWeeklyReview(),
      this.goalProgressStoreService.getAllEvents()
    ]).pipe(
      switchMap(([goals, weeklyReview, progressEvents]) => {
        const evidenceByGoalId =
        this.goalInsightsService.buildEvidenceByGoalId(progressEvents);

        return this.dailyRotationStoreService.generateDailyRotationForDate(
          today,
          goals,
          weeklyReview,
          evidenceByGoalId
        ).pipe(
          switchMap(newRotationItems => this.saveDailyCompletionSummary(newRotationItems).pipe(
            map(() => newRotationItems)
          ))
        );
      })
    );
  }


  //wrapper functions for wording clarity
  public refreshTodayPlan(): Observable<DailyRotationItem[]> {
    return this.regenerateDailyRotationPreservingCompleted();
  }

  private resetTodayPlan(): Observable<DailyRotationItem[]> {
    return this.regenerateDailyRotation();
  }

  private regenerateDailyRotationPreservingCompleted(): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();

    return combineLatest([
      this.dailyRotationStoreService.loadRotationItemsForDate(today),
      this.buildFreshRotationCandidates()
    ]).pipe(
      switchMap(([currentItems, freshItems]) => {
        if (currentItems.length === 0) {
          return this.resetTodayPlan();
        }

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

        return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
          switchMap((latestRotation) => this.saveDailyCompletionSummary(latestRotation).pipe(
            map(() => latestRotation)
          ))
        );
      })
    );
  }

  public setRotationItemCompletedOrUncompleted(
    itemId: string,
    completed: boolean
  ): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();
    return this.dailyRotationStoreService.loadRotationItemsForDate(today).pipe(
      switchMap(items => {
        const target = items.find(item => item.id === itemId);
        if (!target) {
          return of(items);
        }

        const updatedItems = items.map(item =>
          item.id === itemId
            ? { ...item, completed }
            : item
        );

        //persisting the item change doesn't require any feedback from the further services
        const persistUpdatedItems = (): Observable<DailyRotationItem[]> => {
          return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
            switchMap(latestRotation => this.saveDailyCompletionSummary(latestRotation).pipe(
              map(() => latestRotation)
            ) )
          );
        };

        //if completed mark it the goal touch and save progress event
        if (completed && target.goalId) {
          return this.goalStoreService.markGoalTouched(target.goalId).pipe(
            switchMap(() => {
              if (!target.goalId) {
                return persistUpdatedItems();
              }

              return this.goalProgressStoreService.addEvent({
                id: `progress-${Date.now()}`,
                goalId: target.goalId,
                date: today,
                createdAt: new Date().toISOString(),
                type: 'daily_task_completed',
                taskText: target.actionText,
                source: 'daily_rotation',
                sourceItemId: target.id
              }).pipe(
                switchMap(() => persistUpdatedItems())
              )
            })
          );
        }

         //if unmarking the goal complete find the progress event and reverse it by deletion
        return this.goalProgressStoreService.getEventBySourceItemId(target.id).pipe(
          switchMap(existingEvent => {
            if (!existingEvent) {
              return persistUpdatedItems();
            }

            return this.goalProgressStoreService.deleteEvent(existingEvent.id).pipe(
              switchMap(() => persistUpdatedItems())
            )
          })
        )
      })
    );
  }

  public toggleRotationItemCompleted(itemId: string): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();
    return this.dailyRotationStoreService.loadRotationItemsForDate(today).pipe(
      switchMap(items => {
        const target = items.find(item => item.id === itemId);
        if (!target) {
          return of(items);
        }
        return this.setRotationItemCompletedOrUncompleted(itemId, !target.completed);
      })
    );
  }

  public getLastSevenDaysCompletions(): Observable<number> {
    return this.dailyCompletionHistoryStoreService.getSummaries().pipe(
      map(completionHistory => {
        let daysWithCompletions = 0;

        completionHistory.map(summary => {
          if(this.isWithinPast7Days(summary.date) && summary.completionPercent > 0) daysWithCompletions += 1;
        })

        return daysWithCompletions;
      })
    );
    
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

   public replaceRotationItem(itemId: string): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();

    return combineLatest([
      this.dailyRotationStoreService.loadRotationItemsForDate(today),
      this.buildFreshRotationCandidates()
    ]).pipe(
      switchMap(([currentItems, freshItems]) => {
        const itemToReplace = currentItems.find(item => item.id === itemId);
        if (!itemToReplace) {
          return of(currentItems);
        }

        const replacement = this.pickReplacementCandidate(
          itemToReplace,
          currentItems,
          freshItems,
          today
        );

        if (!replacement) {
          return of(currentItems);
        }

        const updatedItems = currentItems.map(item =>
          item.id === itemId ? replacement : item
        );

        return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
          switchMap(latestRotation => this.saveDailyCompletionSummary(latestRotation).pipe(
            map(() => latestRotation)
          ))
        );
      })
    )
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

private buildFreshRotationCandidates(): Observable<DailyRotationItem[]> {
  return combineLatest([
    this.goalStoreService.getGoals(),
    this.weeklyReviewStoreService.getCurrentWeeklyReview(),
    this.goalProgressStoreService.getAllEvents()
  ]).pipe(
    map(([goals, review, progressEvents]) => {
      const evidenceByGoalId = this.goalInsightsService.buildEvidenceByGoalId(progressEvents);

      return this.rotationEngineService.generateDailyRotation(goals, review, evidenceByGoalId);
    })
  );
}

private saveDailyCompletionSummary(items: DailyRotationItem[]): Observable<void> {
  const totalCount = items.length;
  const completedCount = items.filter(item => item.completed).length;
  const completionPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return this.dailyCompletionHistoryStoreService.saveSummary({
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
