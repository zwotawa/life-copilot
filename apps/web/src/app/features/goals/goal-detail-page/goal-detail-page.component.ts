import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { GoalProgressEvent } from 'src/app/core/models/goal-progress-event.model';
import { GoalProgressStoreService } from 'src/app/core/services/goal-progress-store.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { GoalFormComponent } from '../goal-form/goal-form.component';
import { Loadable } from 'src/app/core/models/loadable.model';
import { GoalMilestoneStoreService } from 'src/app/core/services/goal-milestone-store.service';
import { createGoalMilestone } from 'src/app/core/utils/create-goal-milestone';
import { GoalMilestone } from 'src/app/core/models/goal-milestone.model';

interface GoalDetailViewModel {
  goalState: Loadable<Goal>;
  progressEventsState: Loadable<GoalProgressEvent[]>;
  milestonesState: Loadable<GoalMilestone[]>;

  goal: Goal | null;
  progressEvents: GoalProgressEvent[];
  milestones: GoalMilestone[];

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
  @ViewChild(GoalFormComponent)
  private goalFormComponent?: GoalFormComponent;

  public newMilestoneTitle = '';

  public isSavingMilestone = false;
  public deletingMilestoneIds = new Set<string>();

  public milestoneError: string | null = null;
  public editingMilestoneId: string | null = null;
  public editingMilestoneTitle = '';
  public editingMilestoneNotes = '';

  private readonly milestoneReloadSubject = new BehaviorSubject<void>(undefined);
  public readonly milestoneReload$ = this.milestoneReloadSubject.asObservable();

  public canDeactivate(): boolean {
    if (!this.goalFormComponent) {
      return true;
    }

    return this.goalFormComponent.canDeactivate();
  }

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

 public readonly milestonesState$: Observable<Loadable<GoalMilestone[]>> = combineLatest([
    this.goalState$,
    this.milestoneReload$
  ]).pipe(
    switchMap(([goalState]) => {
      const goal = goalState.data;

      if (!goal?.id) {
        return of({
          loading: false,
          data: [],
          error: null
        });
      }

      return this.goalMilestoneStoreService.getMilestonesForGoal(goal.id).pipe(
        map(milestones => ({
          loading: false,
          data: [...milestones].sort((a, b) => a.order - b.order),
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
            error: 'Could not load milestones.'
          })
        )
      );
    }),
    shareReplay(1)
  );

  public readonly vm$: Observable<GoalDetailViewModel> = combineLatest([
  this.goalId$,
  this.goalState$,
  this.progressEventsState$,
  this.milestonesState$
]).pipe(
  map(([goalId, goalState, progressEventsState, milestonesState]) => {
    const pageErrorMessages = [
      goalState.error,
      progressEventsState.error,
      milestonesState.error,
      this.milestoneError
    ].filter((message): message is string => !!message);

    return {
      goalState,
      progressEventsState,
      milestonesState,

      goal: goalState.data,
      progressEvents: progressEventsState.data ?? [],
      milestones: milestonesState.data ?? [],

      isNewGoal: goalId === 'new',
      pageLoading:
        goalState.loading ||
        progressEventsState.loading ||
        milestonesState.loading,
      pageErrorMessages
    };
  }),
  shareReplay(1)
);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly goalStoreService: GoalStoreService,
    private readonly goalProgressStoreService: GoalProgressStoreService,
    private readonly goalMilestoneStoreService: GoalMilestoneStoreService
  ) {

   }

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

  public addMilestone(goal: Goal | null, milestones: GoalMilestone[]): void {
    const title = this.newMilestoneTitle.trim();

    if (!goal?.id || !title || this.isSavingMilestone) {
      return;
    }

    this.isSavingMilestone = true;
    this.milestoneError = null;

    const milestone = createGoalMilestone(goal.id, title, milestones.length);

    if (milestones.length === 0) {
      milestone.status = 'active';
    }

    this.goalMilestoneStoreService.addMilestone(milestone).subscribe({
      next: () => {
        this.newMilestoneTitle = '';
        this.isSavingMilestone = false;
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not add milestone.';
        this.isSavingMilestone = false;
      }
    });
  }

  public setActiveMilestone(goal: Goal | null, milestone: GoalMilestone, milestones: GoalMilestone[]): void {
    if (!goal?.id || this.isSavingMilestone) {
      return;
    }

    this.isSavingMilestone = true;
    this.milestoneError = null;

    const updates = milestones.map(m => {
      if (m.status === 'completed') {
        return m;
      }

      return {
        ...m,
        status: m.id === milestone.id ? 'active' as const : 'not_started' as const
      };
    });

    this.goalMilestoneStoreService.reorderMilestones(goal.id, updates).subscribe({
      next: () => {
        this.isSavingMilestone = false;
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not update active milestone.';
        this.isSavingMilestone = false;
      }
    });
  }

  public completeMilestone(goal: Goal | null, milestone: GoalMilestone, milestones: GoalMilestone[]): void {
    if (!goal?.id || this.isSavingMilestone) {
      return;
    }

    this.isSavingMilestone = true;
    this.milestoneError = null;

    const completedAt = new Date().toISOString();
    const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
    const currentIndex = sortedMilestones.findIndex(m => m.id === milestone.id);

    const nextMilestone = sortedMilestones
      .slice(currentIndex + 1)
      .find(m => m.status === 'not_started');

    const updates = sortedMilestones.map(m => {
      if (m.id === milestone.id) {
        return {
          ...m,
          status: 'completed' as const,
          completedAt
        };
      }

      if (nextMilestone && m.id === nextMilestone.id) {
        return {
          ...m,
          status: 'active' as const
        };
      }

      return m;
    });

    this.goalMilestoneStoreService.reorderMilestones(goal.id, updates).subscribe({
      next: () => {
        this.isSavingMilestone = false;
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not complete milestone.';
        this.isSavingMilestone = false;
      }
    });
  }

  public deleteMilestone(milestone: GoalMilestone): void {
    if (this.deletingMilestoneIds.has(milestone.id)) {
      return;
    }

    this.deletingMilestoneIds.add(milestone.id);
    this.milestoneError = null;

    this.goalMilestoneStoreService.deleteMilestone(milestone.id).subscribe({
      next: () => {
        this.deletingMilestoneIds.delete(milestone.id);
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not delete milestone.';
        this.deletingMilestoneIds.delete(milestone.id);
      }
    });
  }

  public trackByMilestoneId(index: number, milestone: GoalMilestone): string {
    return milestone.id;
  }

  public isDeletingMilestone(milestoneId: string): boolean {
    return this.deletingMilestoneIds.has(milestoneId);
  }

  public getMilestoneStatusLabel(status: GoalMilestone['status']): string {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  }

  public startEditingMilestone(milestone: GoalMilestone): void {
    this.editingMilestoneId = milestone.id;
    this.editingMilestoneTitle = milestone.title;
    this.editingMilestoneNotes = milestone.notes ?? '';
  }

  public cancelEditingMilestone(): void {
    this.editingMilestoneId = null;
    this.editingMilestoneTitle = '';
    this.editingMilestoneNotes = '';
  }

  public saveMilestoneEdits(goal: Goal | null, milestone: GoalMilestone): void {
    if (!goal?.id || !this.editingMilestoneId || this.isSavingMilestone) {
      return;
    }

    const title = this.editingMilestoneTitle.trim();
    if (!title) {
      this.milestoneError = 'Milestone title is required.';
      return;
    }

    this.isSavingMilestone = true;
    this.milestoneError = null;

    const updatedMilestone: GoalMilestone = {
      ...milestone,
      title,
      notes: this.editingMilestoneNotes.trim() || null
    };

    this.goalMilestoneStoreService.updateMilestone(updatedMilestone).subscribe({
      next: () => {
        this.isSavingMilestone = false;
        this.cancelEditingMilestone();
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not save milestone changes.';
        this.isSavingMilestone = false;
      }
    });
  }

  public moveMilestoneUp(goal: Goal | null, milestone: GoalMilestone, milestones: GoalMilestone[]): void {
    this.moveMilestone(goal, milestone, milestones, -1);
  }

  public moveMilestoneDown(goal: Goal | null, milestone: GoalMilestone, milestones: GoalMilestone[]): void {
    this.moveMilestone(goal, milestone, milestones, 1);
  }

  private moveMilestone(
    goal: Goal | null,
    milestone: GoalMilestone,
    milestones: GoalMilestone[],
    direction: -1 | 1
  ): void {
    if (!goal?.id || this.isSavingMilestone) {
      return;
    }

    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(m => m.id === milestone.id);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }

    const reordered = [...sorted];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const updatedMilestones = reordered.map((item, index) => ({
      ...item,
      order: index
    }));

    this.isSavingMilestone = true;
    this.milestoneError = null;

    this.goalMilestoneStoreService.reorderMilestones(goal.id, updatedMilestones).subscribe({
      next: () => {
        this.isSavingMilestone = false;
        this.milestoneReloadSubject.next();
      },
      error: () => {
        this.milestoneError = 'Could not reorder milestones.';
        this.isSavingMilestone = false;
      }
    });
  }

  public isEditingMilestone(milestoneId: string): boolean {
    return this.editingMilestoneId === milestoneId;
  }
}