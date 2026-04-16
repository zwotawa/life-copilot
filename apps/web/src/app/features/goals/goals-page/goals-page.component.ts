import { Component } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { Loadable } from 'src/app/core/models/loadable.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';

interface GoalsPageViewModel {
  goalsState: Loadable<Goal[]>;
  goals: Goal[];
  filteredGoals: Goal[];
  filteredGoalCount: number;
  statusFilter: string;
  laneFilter: string;
  typeFilter: string;
  pageLoading: boolean;
  pageErrorMessages: string[];
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

  public readonly vm$: Observable<GoalsPageViewModel> = combineLatest([
    this.goalsState$,
    this.statusFilter$,
    this.laneFilter$,
    this.typeFilter$
  ]).pipe(
    map(([goalsState, statusFilter, laneFilter, typeFilter]) => {
      const goals = goalsState.data ?? [];
      const filteredGoals = goals.filter(goal => {
        return (
          (statusFilter ? goal.status === statusFilter : true) &&
          (laneFilter ? goal.lane === laneFilter : true) &&
          (typeFilter ? goal.type === typeFilter : true)
        );
      });

      const pageErrorMessages = [
        goalsState.error
      ].filter((message): message is string => !!message);

      return {
        goalsState,
        goals,
        filteredGoals,
        filteredGoalCount: filteredGoals.length,
        statusFilter,
        laneFilter,
        typeFilter,
        pageLoading: goalsState.loading,
        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly goalStoreService: GoalStoreService
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
}