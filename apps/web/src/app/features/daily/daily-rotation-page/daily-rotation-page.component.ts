import { Component } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, finalize } from 'rxjs/operators';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { Loadable } from 'src/app/core/models/loadable.model';
import { PlanningWorkflowService } from 'src/app/core/services/planning-workflow.service';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';
import { NotificationService } from 'src/app/shared/services/notification.service';

interface DailyRotationViewModel {
  rotationState: Loadable<DailyRotationItem[]>;
  completionDaysState: Loadable<number>;

  rotationItems: DailyRotationItem[];
  activeCompletionDays: number;

  completedCount: number;
  totalCount: number;
  completionPercent: number;
  isDayComplete: boolean;
  progressMessage: string;

  pageLoading: boolean;
  pageErrorMessages: string[];
}

@Component({
  selector: 'app-daily-rotation-page',
  templateUrl: './daily-rotation-page.component.html',
  styleUrls: ['./daily-rotation-page.component.scss']
})
export class DailyRotationPageComponent {
  private readonly rotationState$: Observable<Loadable<DailyRotationItem[]>> =
    toLoadable(this.planningWorkflowService.getOrCreateDailyRotation(), 'Could not load today’s menu.');
    
  private readonly completionDaysState$: Observable<Loadable<number>> =
    toLoadable(this.planningWorkflowService.getLastSevenDaysCompletions(), 'Could not load recent completion history.');
    
  private readonly rotationItemsSubject = new BehaviorSubject<DailyRotationItem[]>([]);
  public readonly rotationItems$ = this.rotationItemsSubject.asObservable();

  private readonly activeCompletionDaysSubject = new BehaviorSubject<number>(0);
  public readonly activeCompletionDays$ = this.activeCompletionDaysSubject.asObservable();

  public isRefreshingPlan = false;
  public refreshPlanError: string | null = null;

  public togglingItemIds = new Set<string>();
  public toggleError: string | null = null;

  public replacingItemIds = new Set<string>();
  public replaceError: string | null = null;

  public isGeneratingMore = false;
  public generateMoreError: string | null = null;

  public readonly vm$: Observable<DailyRotationViewModel> = combineLatest([
    this.rotationState$,
    this.completionDaysState$,
    this.rotationItems$,
    this.activeCompletionDays$
  ]).pipe(
    map(([rotationState, completionDaysState, currentRotationItems, currentCompletionDays]) => {
      const rotationItems = currentRotationItems.length > 0 || rotationState.data === null
        ? currentRotationItems
        : (rotationState.data ?? []);

      const activeCompletionDays = currentCompletionDays || completionDaysState.data || 0;

      const completedCount = rotationItems.filter(item => item.completed).length;
      const totalCount = rotationItems.length;
      const completionPercent =
        totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
      const isDayComplete = totalCount > 0 && completedCount === totalCount;

      let progressMessage = 'No items planned for today.';
      if (totalCount > 0 && isDayComplete) {
        progressMessage = 'Done for today.';
      } else if (totalCount > 0 && completedCount === 0) {
        progressMessage = 'Ready to get started.';
      } else if (totalCount > 0) {
        progressMessage = `${completedCount} of ${totalCount} completed.`;
      }

      const pageErrorMessages = [
        rotationState.error,
        completionDaysState.error,
        this.refreshPlanError,
        this.toggleError,
        this.replaceError
      ].filter((message): message is string => !!message);

      return {
        rotationState,
        completionDaysState,

        rotationItems,
        activeCompletionDays,

        completedCount,
        totalCount,
        completionPercent,
        isDayComplete,
        progressMessage,

        pageLoading: rotationState.loading || completionDaysState.loading,
        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly planningWorkflowService: PlanningWorkflowService,
    private notificationService: NotificationService
  ) {
    this.loadInitialData();
  }

  public generateDailyRotation(): void {
    if (this.isRefreshingPlan) {
      return;
    }

    this.isRefreshingPlan = true;
    this.refreshPlanError = null;

    this.planningWorkflowService.refreshTodayPlan().pipe(
      finalize(() => {
        this.isRefreshingPlan = false;
      })
    ).subscribe({
      next: dailyRotationItems => {
        this.rotationItemsSubject.next(dailyRotationItems);
        this.notificationService.success('Daily list regenerated.');
      },
      error: () => {
        this.refreshPlanError = 'Could not regenerate the daily list.';
      }
    });
  }

  public toggleCompleted(item: DailyRotationItem): void {
    if (this.togglingItemIds.has(item.id)) {
      return;
    }

    this.toggleError = null;
    this.togglingItemIds.add(item.id);

    this.planningWorkflowService.toggleRotationItemCompleted(item.id).pipe(
      finalize(() => {
        this.togglingItemIds.delete(item.id);
      })
    ).subscribe({
      next: dailyRotationItems => {
        this.rotationItemsSubject.next(dailyRotationItems);
      },
      error: () => {
        this.toggleError = 'Could not update item completion.';
      }
    });
  }

  public replaceItem(item: DailyRotationItem): void {
    if (this.replacingItemIds.has(item.id)) {
      return;
    }

    this.replaceError = null;
    this.replacingItemIds.add(item.id);

    this.planningWorkflowService.replaceRotationItem(item.id).pipe(
      finalize(() => {
        this.replacingItemIds.delete(item.id);
      })
    ).subscribe({
      next: replacementResponse => {
        this.rotationItemsSubject.next(replacementResponse.items);
        if (replacementResponse.replaced) {
          this.notificationService.success(`Replaced ${item.goalTitle} with ${replacementResponse.messageOrTitle}`);
        } else {
          this.notificationService.success(replacementResponse.messageOrTitle);
        }
      },
      error: () => {
        this.replaceError = 'Could not replace this item.';
      }
    });
  }

  public isItemBusy(itemId: string): boolean {
    return this.togglingItemIds.has(itemId) || this.replacingItemIds.has(itemId);
  }

  public getCategoryLabel(category: DailyRotationItem['category']): string {
    switch (category) {
      case 'responsible':
        return 'Responsible';
      case 'momentum':
        return 'Momentum';
      case 'maintenance':
        return 'Maintenance';
      case 'interesting':
        return 'Interesting';
      case 'fallback':
        return 'Fallback';
      default:
        return category;
    }
  }

  public getCategoryDescription(category: DailyRotationItem['category']): string {
    switch (category) {
      case 'responsible':
        return 'A practical move that keeps life from drifting.';
      case 'momentum':
        return 'A meaningful step on an important goal.';
      case 'maintenance':
        return 'A light touch that keeps the system alive.';
      case 'interesting':
        return 'Something energizing or creatively alive.';
      case 'fallback':
        return 'A very easy move for scattered or low-energy moments.';
      default:
        return '';
    }
  }

  public trackByItemId(index: number, item: DailyRotationItem): string {
    return item.id;
  }

  public generateMoreOptions(): void {
    if (this.isGeneratingMore) {
      return;
    }

    this.isGeneratingMore = true;
    this.generateMoreError = null;

    this.planningWorkflowService.generateMoreDailyOptions().subscribe({
      next: dailyRotationItems => {
        this.rotationItemsSubject.next(dailyRotationItems);
        this.notificationService.success('Added more daily options.');
        this.isGeneratingMore = false;
      },
      error: () => {
        this.generateMoreError = 'Could not generate more daily options.';
        this.isGeneratingMore = false;
      }
    });
  }

  private loadInitialData(): void {
    this.rotationState$.subscribe({
      next: state => {
        if (state.data) {
          this.rotationItemsSubject.next(state.data);
        }
      }
    });

    this.completionDaysState$.subscribe({
      next: state => {
        if (state.data !== null) {
          this.activeCompletionDaysSubject.next(state.data);
        }
      }
    });
  }
}