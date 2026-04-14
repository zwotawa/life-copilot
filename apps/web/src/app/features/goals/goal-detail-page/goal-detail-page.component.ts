import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { GoalProgressEvent } from 'src/app/core/models/goal-progress-event.model';
import { GoalProgressStoreService } from 'src/app/core/services/goal-progress-store.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';

interface Loadable<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

interface GoalDetailViewModel {
  goalState: Loadable<Goal>;
  progressEventsState: Loadable<GoalProgressEvent[]>;

  goal: Goal | null;
  progressEvents: GoalProgressEvent[];

  isNewGoal: boolean;
  pageLoading: boolean;
  pageErrorMessages: string[];
}

@Component({
  selector: 'app-goal-detail-page',
  templateUrl: './goal-detail-page.component.html',
  styleUrls: ['./goal-detail-page.component.scss']
})
export class GoalDetailPageComponent {
  public readonly goalId$: Observable<string> = this.route.paramMap.pipe(
    map(params => params.get('id') || ''),
    filter(id => !!id),
    distinctUntilChanged(),
    shareReplay(1)
  );

  public readonly goalState$: Observable<Loadable<Goal>> = this.goalId$.pipe(
    switchMap(goalId => {
      if (goalId === 'new') {
        return of({
          loading: false,
          data: {} as Goal,
          error: null
        });
      }

      return this.goalStoreService.getGoalById(goalId).pipe(
        map(goal => ({
          loading: false,
          data: goal ?? ({} as Goal),
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
            error: 'Could not load goal details.'
          })
        )
      );
    }),
    shareReplay(1)
  );

  public readonly progressEventsState$: Observable<Loadable<GoalProgressEvent[]>> = this.goalState$.pipe(
    switchMap(goalState => {
      const goal = goalState.data;

      if (!goal?.id) {
        return of({
          loading: false,
          data: [],
          error: null
        });
      }

      return this.goalProgressStoreService.getEventsForGoal(goal.id).pipe(
        map(events => ({
          loading: false,
          data: [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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
            data: [],
            error: 'Could not load progress history.'
          })
        )
      );
    }),
    shareReplay(1)
  );

  public readonly vm$: Observable<GoalDetailViewModel> = combineLatest([
    this.goalId$,
    this.goalState$,
    this.progressEventsState$
  ]).pipe(
    map(([goalId, goalState, progressEventsState]) => {
      const pageErrorMessages = [
        goalState.error,
        progressEventsState.error
      ].filter((message): message is string => !!message);

      return {
        goalState,
        progressEventsState,

        goal: goalState.data,
        progressEvents: progressEventsState.data ?? [],

        isNewGoal: goalId === 'new',
        pageLoading: goalState.loading || progressEventsState.loading,
        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly goalStoreService: GoalStoreService,
    private readonly goalProgressStoreService: GoalProgressStoreService
  ) {}

  public formatEventType(type: string): string {
    switch (type) {
      case 'daily_task_completed':
        return 'Daily task completed';
      case 'daily_task_uncompleted':
        return 'Daily task uncompleted';
      case 'milestone_completed':
        return 'Milestone completed';
      case 'note':
        return 'Note';
      case 'status_changed':
        return 'Status changed';
      default:
        return type;
    }
  }

  public getEventTypeClass(type: string): string {
    switch (type) {
      case 'daily_task_completed':
        return 'goal-progress__type--completed';
      case 'daily_task_uncompleted':
        return 'goal-progress__type--uncompleted';
      case 'milestone_completed':
        return 'goal-progress__type--milestone';
      case 'note':
        return 'goal-progress__type--note';
      case 'status_changed':
        return 'goal-progress__type--status';
      default:
        return 'goal-progress__type--default';
    }
  }

  public trackByEventId(index: number, event: GoalProgressEvent): string {
    return event.id;
  }
}