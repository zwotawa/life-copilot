import { Component } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, finalize } from 'rxjs/operators';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { PlanningWorkflowService } from 'src/app/core/services/planning-workflow.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

interface Loadable<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

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
  private readonly initialRotationState$: Observable<Loadable<DailyRotationItem[]>> =
    this.planningWorkflowService.getOrCreateDailyRotation().pipe(
      map(items => ({
        loading: false,
        data: items,
        error: null
      })),
      startWith({
        loading: true,
        data: null,
        error: null
      }),
      catchError(() =>
        of({
          loading: false,
          data: null,
          error: 'Could not load today’s menu.'
        })
      ),
      shareReplay(1)
    );

  private readonly initialCompletionDaysState$: Observable<Loadable<number>> =
    this.planningWorkflowService.getLastSevenDaysCompletions().pipe(
      map(days => ({
        loading: false,
        data: days,
        error: null
      })),
      startWith({
        loading: true,
        data: null,
        error: null
      }),
      catchError(() =>
        of({
          loading: false,
          data: null,
          error: 'Could not load recent completion history.'
        })
      ),
      shareReplay(1)
    );

  public rotationItems: DailyRotationItem[] = [];
  public activeCompletionDays = 0;

  public isRefreshingPlan = false;
  public refreshPlanError: string | null = null;

  public togglingItemIds = new Set<string>();
  public toggleError: string | null = null;

  public replacingItemIds = new Set<string>();
  public replaceError: string | null = null;

  public readonly vm$: Observable<DailyRotationViewModel> = combineLatest([
    this.initialRotationState$,
    this.initialCompletionDaysState$
  ]).pipe(
    map(([rotationState, completionDaysState]) => {
      const rotationItems = this.rotationItems.length > 0 || rotationState.data === null
        ? this.rotationItems
        : (rotationState.data ?? []);

      const activeCompletionDays = this.activeCompletionDays || completionDaysState.data || 0;

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
        this.rotationItems = dailyRotationItems;
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
        this.rotationItems = dailyRotationItems;
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
      next: replacementItems => {
        this.rotationItems = replacementItems;
        this.notificationService.success('Item replaced.');
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

  private loadInitialData(): void {
    this.initialRotationState$.subscribe({
      next: state => {
        if (state.data) {
          this.rotationItems = state.data;
        }
      }
    });

    this.initialCompletionDaysState$.subscribe({
      next: state => {
        if (state.data !== null) {
          this.activeCompletionDays = state.data;
        }
      }
    });
  }
}