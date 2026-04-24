import { Injectable } from '@angular/core';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { GoalStoreService } from './goal-store.service';
import { WeeklyReviewStoreService } from './weekly-review-store.service';
import { DailyRotationStoreService } from './daily-rotation-store.service';
import { RotationEngineService } from './rotation-engine.service';
import { DailyCompletionHistoryStoreService } from './daily-completion-history-store.service';
import { combineLatest, map, Observable, of, switchMap, tap } from 'rxjs';
import { GoalProgressStoreService } from './goal-progress-store.service';
import { GoalInsightsService } from './goal-insights.service';
import { SurfacingDecisionRepository } from '../repositories/surfacing-decision.repository';
import { SurfacingDecisionEvent } from '../models/surfacing-decision-event.model';
import { createSurfacingDecisionEvent } from '../utils/create-surfacing-decision-event';
import { GoalMilestoneStoreService } from './goal-milestone-store.service';
import { GoalTinyTaskStoreService } from './goal-tiny-task-store.service';
import { GoalExecutionContextService } from './goal-execution-context.service';
import { GoalMilestone } from '../models/goal-milestone.model';
import { GoalTinyTask } from '../models/goal-tiny-task.model';
import { Goal } from '../models/goal.model';

export interface ReplacementResponse {
  items: DailyRotationItem[],
  messageOrTitle: string,
  replaced: boolean
}

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
    private goalInsightsService: GoalInsightsService,
    private readonly surfacingDecisionRepository: SurfacingDecisionRepository,
    private goalMilestoneStoreService: GoalMilestoneStoreService,
    private goalTinyTaskStoreService: GoalTinyTaskStoreService,
    private goalExecutionContextService: GoalExecutionContextService,
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

        return this.loadMilestonesForGoals(goals).pipe(
          switchMap(milestones =>
            this.loadTinyTasksForMilestones(milestones).pipe(
              switchMap(tinyTasks => {
                const executionContextByGoalId =
                  this.goalExecutionContextService.buildExecutionContextByGoalId(
                    milestones,
                    tinyTasks
                  );

                return this.dailyRotationStoreService.generateDailyRotationForDate(
                  today,
                  goals,
                  weeklyReview,
                  evidenceByGoalId,
                  executionContextByGoalId
                ).pipe(
                  switchMap(newRotationItems =>
                    this.saveDailyCompletionSummary(newRotationItems).pipe(
                      tap(() => {
                        const decisionEvents =
                          this.buildDailyGenerationDecisionEvents(newRotationItems);

                        if (decisionEvents.length === 0) {
                          return;
                        }

                        this.surfacingDecisionRepository.addEvents(decisionEvents).subscribe({
                          next: () => {},
                          error: () => {}
                        });
                      }),
                      map(() => newRotationItems)
                    )
                  )
                );
              })
            )
          )
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

      const generatedItems: DailyRotationItem[] = [];

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

        if (!replacement || replacement.goalId === currentItem.goalId) {
          return currentItem;
        }

        if (replacement.goalId) {
          usedGoalIds.add(replacement.goalId);
        }

        generatedItems.push(replacement);

        return replacement;
      });

      return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
        switchMap(latestRotation =>
          this.saveDailyCompletionSummary(latestRotation).pipe(
            tap(() => {
              const decisionEvents =
                this.buildDailyGenerationDecisionEvents(generatedItems);

              if (decisionEvents.length === 0) {
                return;
              }

              this.surfacingDecisionRepository.addEvents(decisionEvents).subscribe({
                next: () => {},
                error: err => {}
              });
            }),
            map(() => latestRotation)
          )
        )
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
                switchMap(() => {
                  return this.completeLinkedTinyTask(target).pipe(
                    switchMap(() => persistUpdatedItems())
                  );
                })
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
              switchMap(() => this.uncompleteLinkedTinyTask(target).pipe(
                switchMap(() => persistUpdatedItems())
              ))
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

  public generateMoreDailyOptions(): Observable<DailyRotationItem[]> {
    const today = this.getTodayKey();

    return combineLatest([
      this.dailyRotationStoreService.loadRotationItemsForDate(today),
      this.buildFreshRotationCandidates()
    ]).pipe(
      switchMap(([currentItems, freshItems]) => {
        const usedGoalIds = new Set(
          currentItems
            .filter(item => !!item.goalId)
            .map(item => item.goalId as string)
        );

        const additionalItems = this.pickAdditionalDailyItems(
          freshItems,
          usedGoalIds,
          3
        );

        if (additionalItems.length === 0) {
          return of(currentItems);
        }

        const updatedItems = [...currentItems, ...additionalItems];

        return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
          switchMap(latestRotation =>
            this.saveDailyCompletionSummary(latestRotation).pipe(
              tap(() => {
                const decisionEvents =
                  this.buildDailyGenerationDecisionEvents(additionalItems);

                if (decisionEvents.length === 0) {
                  return;
                }

                this.surfacingDecisionRepository.addEvents(decisionEvents).subscribe({
                  next: () => {},
                  error: () => {}
                });
              }),
              map(() => latestRotation)
            )
          )
        );
      })
    );
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

   public replaceRotationItem(itemId: string): Observable<ReplacementResponse> {
    const today = this.getTodayKey();

    return combineLatest([
      this.dailyRotationStoreService.loadRotationItemsForDate(today),
      this.buildFreshRotationCandidates()
    ]).pipe(
      switchMap(([currentItems, freshItems]) => {
        const itemToReplace = currentItems.find(item => item.id === itemId);
        if (!itemToReplace) {
          const replacementResponse = {
            items: currentItems,
            messageOrTitle: 'Could not find item being replaced.',
            replaced: false
          }
          return of(replacementResponse);
        }

        const replacement = this.pickReplacementCandidate(
          itemToReplace,
          currentItems,
          freshItems,
          today
        );

        if (!replacement) {
          const replacementResponse = {
            items: currentItems,
            messageOrTitle: 'Could not find a suitable replacement.',
            replaced: false
          }
          return of(replacementResponse);
        }

        const updatedItems = currentItems.map(item =>
          item.id === itemId ? replacement : item
        );

        return this.dailyRotationStoreService.saveRotationItemsForDate(today, updatedItems).pipe(
          switchMap(latestRotation => this.saveDailyCompletionSummary(latestRotation).pipe(
            tap(() => {
              if (!replacement.goalId) return;
              const replacementEvent = this.buildDailyReplaceDecisionEvent(itemToReplace, replacement);

              this.surfacingDecisionRepository.addEvent(replacementEvent).subscribe({
                next: () => {},
                error: () => {}
              });
            }),
            map(() => {
              return {
                items: latestRotation,
                messageOrTitle: replacement.goalTitle,
                replaced: true
              }

            })
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
    switchMap(([goals, review, progressEvents]) => {
      const evidenceByGoalId =
        this.goalInsightsService.buildEvidenceByGoalId(progressEvents);

      return this.loadMilestonesForGoals(goals).pipe(
        switchMap(milestones =>
          this.loadTinyTasksForMilestones(milestones).pipe(
            map(tinyTasks => {
              const executionContextByGoalId =
                this.goalExecutionContextService.buildExecutionContextByGoalId(
                  milestones,
                  tinyTasks
                );

              return this.rotationEngineService.generateDailyRotation(
                goals,
                review,
                evidenceByGoalId,
                executionContextByGoalId
              );
            })
          )
        )
      );
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

private buildDailyReplaceDecisionEvent(
  originalItem: DailyRotationItem,
  replacementItem: DailyRotationItem
): SurfacingDecisionEvent {
  return createSurfacingDecisionEvent({
    context: 'daily_replace',
    goalId: replacementItem.goalId ?? '',
    goalTitle: replacementItem.goalTitle,
    score: replacementItem.surfacingScore ?? 0,
    suggestedCategory: replacementItem.category,
    reasons: replacementItem.surfacingReasons ?? [],
    metadata: {
      date: replacementItem.date,
      replacedGoalId: originalItem.goalId
    }
  });
}

private buildDailyGenerationDecisionEvents(
  items: DailyRotationItem[]
): SurfacingDecisionEvent[] {
  return items
    .filter(item => !!item.goalId)
    .map(item =>
      createSurfacingDecisionEvent({
        context: 'daily_generation',
        goalId: item.goalId ?? '',
        goalTitle: item.goalTitle,
        score: item.surfacingScore ?? 0,
        suggestedCategory: item.category,
        reasons: item.surfacingReasons ?? [],
        metadata: {
          date: item.date
        }
      })
    );
}

private pickAdditionalDailyItems(
  freshItems: DailyRotationItem[],
  usedGoalIds: Set<string>,
  maxItems: number
): DailyRotationItem[] {
  const availableItems = freshItems.filter(item =>
    !!item.goalId && !usedGoalIds.has(item.goalId)
  );

  const pickOne = (category: DailyRotationItem['category']): DailyRotationItem | null => {
    const match = availableItems.find(item => item.category === category);
    if (!match) {
      return null;
    }

    usedGoalIds.add(match.goalId ?? '');
    const index = availableItems.findIndex(item => item.id === match.id);
    if (index >= 0) {
      availableItems.splice(index, 1);
    }

    return match;
  };

  const selected: DailyRotationItem[] = [];

  const preferredOrder: DailyRotationItem['category'][] = [
    'momentum',
    'maintenance',
    'responsible',
    'interesting',
    'fallback'
  ];

  for (const category of preferredOrder) {
    if (selected.length >= maxItems) {
      break;
    }

    const picked = pickOne(category);
    if (picked) {
      selected.push(picked);
    }
  }

  while (selected.length < maxItems && availableItems.length > 0) {
    const next = availableItems.shift();
    if (next) {
      if (next.goalId) {
        usedGoalIds.add(next.goalId);
      }
      selected.push(next);
    }
  }

  return selected;
}

private loadMilestonesForGoals(goals: Goal[]): Observable<GoalMilestone[]> {
  const goalIds = goals
    .filter(goal => !!goal.id)
    .map(goal => goal.id);

  if (goalIds.length === 0) {
    return of([]);
  }

  return combineLatest(
    goalIds.map(goalId => this.goalMilestoneStoreService.getMilestonesForGoal(goalId))
  ).pipe(
    map(results => results.flat())
  );
}

private loadTinyTasksForMilestones(milestones: GoalMilestone[]): Observable<GoalTinyTask[]> {
  const milestoneIds = milestones
    .filter(milestone => !!milestone.id)
    .map(milestone => milestone.id);

  if (milestoneIds.length === 0) {
    return of([]);
  }

  return combineLatest(
    milestoneIds.map(milestoneId => this.goalTinyTaskStoreService.getTasksForMilestone(milestoneId))
  ).pipe(
    map(results => results.flat())
  );
}

private completeLinkedTinyTask(item: DailyRotationItem): Observable<void> {
  if (!item.tinyTaskId || !item.milestoneId) {
    return of(void 0);
  }

  return this.goalTinyTaskStoreService.getTasksForMilestone(item.milestoneId!).pipe(
    map(tasks => tasks.find(task => task.id === item.tinyTaskId) ?? null),
    switchMap(task => {
      if (!task || task.status === 'completed') {
        return of(void 0);
      }

      return this.goalTinyTaskStoreService.updateTask({
        ...task,
        status: 'completed',
        completedAt: new Date().toISOString()
      }).pipe(
        map(() => void 0)
      );
    })
  );
}

private uncompleteLinkedTinyTask(item: DailyRotationItem): Observable<void> {
  if (!item.tinyTaskId || !item.milestoneId) {
    return of(void 0);
  }

  return this.goalTinyTaskStoreService.getTasksForMilestone(item.milestoneId!).pipe(
    map(tasks => tasks.find(task => task.id === item.tinyTaskId) ?? null),
    switchMap(task => {
      if (!task || task.status !== 'completed') {
        return of(void 0);
      }

      return this.goalTinyTaskStoreService.updateTask({
        ...task,
        status: 'not_started',
        completedAt: null
      }).pipe(
        map(() => void 0)
      );
    })
  );
}


}
