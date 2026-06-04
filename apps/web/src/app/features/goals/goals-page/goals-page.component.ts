import { Component } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { GoalMilestone } from 'src/app/core/models/goal-milestone.model';
import { GoalExecutionContext } from 'src/app/core/models/goal-execution-context.model';
import { GoalRoadmapStatus } from 'src/app/core/models/goal-roadmap-status.model';
import { GoalTinyTask } from 'src/app/core/models/goal-tiny-task.model';

import { Goal } from 'src/app/core/models/goal.model';
import { Loadable } from 'src/app/core/models/loadable.model';
import { GoalMilestoneStoreService } from 'src/app/core/services/goal-milestone-store.service';
import { GoalExecutionContextService } from 'src/app/core/services/goal-execution-context.service';
import { GoalRoadmapStatusService } from 'src/app/core/services/goal-roadmap-status.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { GoalTinyTaskStoreService } from 'src/app/core/services/goal-tiny-task-store.service';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';
import { isGoalVisibleByDefault } from '../utils/goal-status.util';

interface GoalsPageViewModel {
  goalsState: Loadable<Goal[]>;
  goals: Goal[];
  roadmapStatusByGoalIdState: Loadable<Record<string, GoalRoadmapStatus>>;
  roadmapStatusByGoalId: Record<string, GoalRoadmapStatus>;
  executionContextByGoalIdState: Loadable<Record<string, GoalExecutionContext>>;
  executionContextByGoalId: Record<string, GoalExecutionContext>;
  filteredGoals: Goal[];
  filteredGoalCount: number;
  statusFilter: string;
  laneFilter: string;
  typeFilter: string;
  pageLoading: boolean;
  pageErrorMessages: string[];
}

interface GoalsRoadmapData {
  goals: Goal[];
  milestones: GoalMilestone[];
  tinyTasks: GoalTinyTask[];
}

@Component({
  selector: 'app-goals-page',
  templateUrl: './goals-page.component.html',
  styleUrls: ['./goals-page.component.scss']
})
export class GoalsPageComponent {
  private readonly statusFilterSubject = new BehaviorSubject<string>('');
  private readonly laneFilterSubject = new BehaviorSubject<string>('');
  private readonly typeFilterSubject = new BehaviorSubject<string>('');

  public readonly statusFilter$ = this.statusFilterSubject.asObservable();
  public readonly laneFilter$ = this.laneFilterSubject.asObservable();
  public readonly typeFilter$ = this.typeFilterSubject.asObservable();

  private readonly goalsState$: Observable<Loadable<Goal[]>> =
    toLoadable(this.goalStoreService.getGoals(), 'Could not load goals.');

  public readonly roadmapDataState$: Observable<Loadable<GoalsRoadmapData>> = this.goalsState$.pipe(
    switchMap(goalState => {
      const goals = goalState.data ?? [];

      if (goalState.loading && !goalState.data) {
        return of({
          loading: true,
          data: null,
          error: null
        });
      }

      if (goalState.error) {
        return of({
          loading: false,
          data: null,
          error: goalState.error
        });
      }

      if (goals.length === 0) {
        return of({
          loading: false,
          data: {
            goals,
            milestones: [],
            tinyTasks: []
          },
          error: null
        });
      }

      return this.loadMilestonesForGoals(goals).pipe(
            switchMap(milestones =>
              this.loadTinyTasksForMilestones(milestones).pipe(
                map(tinyTasks => ({
                  loading: false,
                  data: {
                    goals,
                    milestones,
                    tinyTasks
                  },
                  error: null
                }))
              )
            ),
            startWith({
              loading: true,
              data: null,
              error: null
            }),
            catchError(() =>
              of({
                loading: false,
                data: null,
                error: 'Could not load roadmap data.'
              })
            )
          );
        }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly roadmapStatusByGoalIdState$: Observable<Loadable<Record<string, GoalRoadmapStatus>>> = 
    
    this.roadmapDataState$
  .pipe(
    map((roadmapDataState) => {
      if (roadmapDataState.loading) {
        return {
          loading: true,
          data: null,
          error: null
        };
      }

      if (roadmapDataState.error) {
        return {
          loading: false,
          data: null,
          error: roadmapDataState.error
        };
      }

      const goals = roadmapDataState.data?.goals ?? [];
      const milestones = roadmapDataState.data?.milestones ?? [];
      const tinyTasks = roadmapDataState.data?.tinyTasks ?? [];

      return {
        loading: false,
        error: null,
        data: this.goalRoadmapStatusService.buildStatusByGoalId(
          goals,
          milestones,
          tinyTasks
        )
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly executionContextByGoalIdState$: Observable<Loadable<Record<string, GoalExecutionContext>>> =
    this.roadmapDataState$
      .pipe(
        map((roadmapDataState) => {
          if (roadmapDataState.loading) {
            return {
              loading: true,
              data: null,
              error: null
            };
          }

          if (roadmapDataState.error) {
            return {
              loading: false,
              data: null,
              error: roadmapDataState.error
            };
          }

          const milestones = roadmapDataState.data?.milestones ?? [];
          const tinyTasks = roadmapDataState.data?.tinyTasks ?? [];

          return {
            loading: false,
            error: null,
            data: this.goalExecutionContextService.buildExecutionContextByGoalId(
              milestones,
              tinyTasks
            )
          };
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );

  public readonly vm$: Observable<GoalsPageViewModel> = combineLatest([
    this.goalsState$,
    this.roadmapStatusByGoalIdState$,
    this.executionContextByGoalIdState$,
    this.statusFilter$,
    this.laneFilter$,
    this.typeFilter$
  ]).pipe(
    map(([goalsState, roadmapStatusByGoalIdState, executionContextByGoalIdState, statusFilter, laneFilter, typeFilter]) => {
      const goals = goalsState.data ?? [];
      const filteredGoals = goals.filter(goal => {
        return (
          (statusFilter ? goal.status === statusFilter : isGoalVisibleByDefault(goal)) &&
          (laneFilter ? goal.lane === laneFilter : true) &&
          (typeFilter ? goal.type === typeFilter : true)
        );
      });
      const roadmapStatusByGoalId = roadmapStatusByGoalIdState.data ?? {};
      const executionContextByGoalId = executionContextByGoalIdState.data ?? {};

      const pageErrorMessages = [
        goalsState.error,
        roadmapStatusByGoalIdState.error,
        executionContextByGoalIdState.error
      ].filter((message): message is string => !!message);

      return {
        goalsState,
        goals,
        roadmapStatusByGoalIdState,
        roadmapStatusByGoalId,
        executionContextByGoalIdState,
        executionContextByGoalId,
        filteredGoals,
        filteredGoalCount: filteredGoals.length,
        statusFilter,
        laneFilter,
        typeFilter,
        pageLoading: goalsState.loading || roadmapStatusByGoalIdState.loading || executionContextByGoalIdState.loading,
        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly goalMilestoneStoreService: GoalMilestoneStoreService,
    private readonly goalTinyTaskStoreService: GoalTinyTaskStoreService,
    private readonly goalExecutionContextService: GoalExecutionContextService,
    private readonly goalRoadmapStatusService: GoalRoadmapStatusService
  ) {}

  public updateStatusFilter(value: string): void {
    this.statusFilterSubject.next(value);
  }

  public updateLaneFilter(value: string): void {
    this.laneFilterSubject.next(value);
  }

  public updateTypeFilter(value: string): void {
    this.typeFilterSubject.next(value);
  }

  public clearFilters(): void {
    this.statusFilterSubject.next('');
    this.laneFilterSubject.next('');
    this.typeFilterSubject.next('');
  }

  public trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
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
}
