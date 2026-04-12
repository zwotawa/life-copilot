import { Component } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { WeeklyExecutionInsights } from 'src/app/core/models/weekly-execution-insights.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { GoalSurfacingService } from 'src/app/core/services/goal-surfacing.service';
import { WeeklyInsightService } from 'src/app/core/services/weekly-insights.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';

interface Loadable<T> {
  loading: boolean;
  data: T | null;
  error: string | null;
}

interface WeeklyReviewViewModel {
  goalsState: Loadable<Goal[]>;
  reviewState: Loadable<WeeklyReviewState>;
  insightsState: Loadable<WeeklyExecutionInsights | null>;

  goals: Goal[];
  review: WeeklyReviewState | null;
  weeklyInsights: WeeklyExecutionInsights | null;

  activeGoals: Goal[];
  anchorCandidates: Goal[];
  maintenanceCandidates: Goal[];
  infrastructureCandidates: Goal[];
  creativeCandidates: Goal[];

  selectedAnchorGoals: Goal[];
  selectedMaintenanceGoals: Goal[];
  selectedInfrastructureGoal: Goal | null;
  selectedCreativeGoal: Goal | null;

  hasUnsavedChanges: boolean;

  pageLoading: boolean;
  pageErrorMessages: string[];
}

@Component({
  selector: 'app-weekly-review-page',
  templateUrl: './weekly-review-page.component.html',
  styleUrls: ['./weekly-review-page.component.scss']
})
export class WeeklyReviewPageComponent {
  private readonly reviewDraftSubject = new BehaviorSubject<WeeklyReviewState | null>(null);
  public readonly reviewDraft$ = this.reviewDraftSubject.asObservable();

  private lastSavedReview: WeeklyReviewState | null = null;

  private readonly initialGoalsState$: Observable<Loadable<Goal[]>> =
    this.goalStoreService.getGoals().pipe(
      map(goals => ({
        loading: false,
        data: goals,
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
          error: 'Could not load goals.'
        })
      ),
      shareReplay(1)
    );

  private readonly initialReviewState$: Observable<Loadable<WeeklyReviewState>> =
    this.weeklyReviewStoreService.getCurrentWeeklyReview().pipe(
      map(review => ({
        loading: false,
        data: review,
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
          error: 'Could not load weekly review.'
        })
      ),
      shareReplay(1)
    );

  private readonly initialInsightsState$: Observable<Loadable<WeeklyExecutionInsights | null>> =
    this.weeklyInsightService.getLast7DaysInsights().pipe(
      map(weeklyInsights => ({
        loading: false,
        data: weeklyInsights,
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
          error: 'Could not load weekly execution insights.'
        })
      ),
      shareReplay(1)
    );

  public isSaving = false;
  public saveError: string | null = null;

  public isResetting = false;
  public resetError: string | null = null;

  public readonly vm$: Observable<WeeklyReviewViewModel> = combineLatest([
    this.initialGoalsState$,
    this.initialReviewState$,
    this.initialInsightsState$,
    this.reviewDraft$
  ]).pipe(
    map(([goalsState, reviewState, insightsState, reviewDraft]) => {
      const goals = goalsState.data ?? [];
      const review = reviewDraft ?? reviewState.data ?? null;
      const weeklyInsights = insightsState.data ?? null;
      const activeGoals = goals.filter(goal => goal.status === 'active');

      const anchorCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal => goal.type !== 'maintain'),
            review
          )
        : [];

      const maintenanceCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal => goal.type === 'maintain'),
            review
          )
        : [];

      const infrastructureCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal =>
              goal.type === 'maintain' ||
              [
                'life_systems',
                'money_admin',
                'home_environment',
                'community_tools',
                'mobility_transportation'
              ].includes(goal.lane)
            ),
            review
          )
        : [];

      const creativeCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal =>
              goal.type === 'exploration' ||
              goal.lane === 'creative_experiments'
            ),
            review
          )
        : [];

      const selectedAnchorGoals = review
        ? goals.filter(goal => review.anchorGoalIds.includes(goal.id))
        : [];

      const selectedMaintenanceGoals = review
        ? goals.filter(goal => review.maintenanceGoalIds.includes(goal.id))
        : [];

      const selectedInfrastructureGoal = review?.infrastructureGoalId
        ? goals.find(goal => goal.id === review.infrastructureGoalId) ?? null
        : null;

      const selectedCreativeGoal = review?.creativeGoalId
        ? goals.find(goal => goal.id === review.creativeGoalId) ?? null
        : null;

      const pageErrorMessages = [
        goalsState.error,
        reviewState.error,
        insightsState.error,
        this.saveError,
        this.resetError
      ].filter((message): message is string => !!message);

      return {
        goalsState,
        reviewState,
        insightsState,

        goals,
        review,
        weeklyInsights,

        activeGoals,
        anchorCandidates,
        maintenanceCandidates,
        infrastructureCandidates,
        creativeCandidates,

        selectedAnchorGoals,
        selectedMaintenanceGoals,
        selectedInfrastructureGoal,
        selectedCreativeGoal,

        hasUnsavedChanges: this.computeHasUnsavedChanges(review),

        pageLoading:
          goalsState.loading ||
          reviewState.loading ||
          insightsState.loading,

        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly weeklyReviewStoreService: WeeklyReviewStoreService,
    private readonly goalSurfacingService: GoalSurfacingService,
    private readonly weeklyInsightService: WeeklyInsightService
  ) {
    this.loadInitialReviewDraft();
  }

  public save(): void {
    const reviewDraft = this.reviewDraftSubject.value;

    if (!reviewDraft || this.isSaving || !this.computeHasUnsavedChanges(reviewDraft)) {
      return;
    }

    this.isSaving = true;
    this.saveError = null;

    this.weeklyReviewStoreService.saveWeeklyReview(reviewDraft).pipe(
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: savedReview => {
        const clonedReview = this.cloneReview(savedReview);
        this.lastSavedReview = this.cloneReview(clonedReview);
        this.reviewDraftSubject.next(clonedReview);
      },
      error: () => {
        this.saveError = 'Could not save weekly review.';
      }
    });
  }

  public reset(): void {
    if (this.isResetting) {
      return;
    }

    this.isResetting = true;
    this.resetError = null;

    this.weeklyReviewStoreService.resetWeeklyReview().pipe(
      finalize(() => {
        this.isResetting = false;
      })
    ).subscribe({
      next: review => {
        const clonedReview = this.cloneReview(review);
        this.lastSavedReview = this.cloneReview(clonedReview);
        this.reviewDraftSubject.next(clonedReview);
      },
      error: () => {
        this.resetError = 'Could not reset weekly review.';
      }
    });
  }

  public revertChanges(): void {
    if (!this.lastSavedReview || this.isSaving || this.isResetting) {
      return;
    }

    this.reviewDraftSubject.next(this.cloneReview(this.lastSavedReview));
    this.saveError = null;
    this.resetError = null;
  }

  public isAnchorSelected(goalId: string): boolean {
    const reviewDraft = this.reviewDraftSubject.value;
    return !!reviewDraft?.anchorGoalIds.includes(goalId);
  }

  public toggleAnchor(goalId: string): void {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return;
    }

    if (this.isAnchorSelected(goalId)) {
      this.reviewDraftSubject.next({
        ...reviewDraft,
        anchorGoalIds: reviewDraft.anchorGoalIds.filter(id => id !== goalId)
      });
      return;
    }

    if (reviewDraft.anchorGoalIds.length < 2) {
      this.reviewDraftSubject.next({
        ...reviewDraft,
        anchorGoalIds: [...reviewDraft.anchorGoalIds, goalId]
      });
    }
  }

  public isMaintenanceSelected(goalId: string): boolean {
    const reviewDraft = this.reviewDraftSubject.value;
    return !!reviewDraft?.maintenanceGoalIds.includes(goalId);
  }

  public toggleMaintenance(goalId: string): void {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return;
    }

    if (this.isMaintenanceSelected(goalId)) {
      this.reviewDraftSubject.next({
        ...reviewDraft,
        maintenanceGoalIds: reviewDraft.maintenanceGoalIds.filter(id => id !== goalId)
      });
      return;
    }

    if (reviewDraft.maintenanceGoalIds.length < 5) {
      this.reviewDraftSubject.next({
        ...reviewDraft,
        maintenanceGoalIds: [...reviewDraft.maintenanceGoalIds, goalId]
      });
    }
  }

  public updateInfrastructureGoal(goalId: string | null): void {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return;
    }

    this.reviewDraftSubject.next({
      ...reviewDraft,
      infrastructureGoalId: goalId
    });
  }

  public updateCreativeGoal(goalId: string | null): void {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return;
    }

    this.reviewDraftSubject.next({
      ...reviewDraft,
      creativeGoalId: goalId
    });
  }

  public updateNotes(notes: string): void {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return;
    }

    this.reviewDraftSubject.next({
      ...reviewDraft,
      notes
    });
  }

  public trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }

  public isAnchorDisabled(goalId: string): boolean {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return true;
    }

    return !this.isAnchorSelected(goalId) && reviewDraft.anchorGoalIds.length >= 2;
  }

  public isMaintenanceDisabled(goalId: string): boolean {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return true;
    }

    return !this.isMaintenanceSelected(goalId) && reviewDraft.maintenanceGoalIds.length >= 5;
  }

  public getSurfacingScore(goal: Goal): number {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return 0;
    }

    return this.goalSurfacingService.getSurfacingScore(goal, reviewDraft);
  }

  public getSuggestedCategory(goal: Goal): string | null {
    const reviewDraft = this.reviewDraftSubject.value;
    if (!reviewDraft) {
      return null;
    }

    return this.goalSurfacingService.getSuggestedDailyCategory(goal, reviewDraft);
  }

  public getFreshnessLabel(goal: Goal): string {
    if (!goal.lastTouchedAt) {
      return 'No touch recorded';
    }

    const lastTouched = new Date(goal.lastTouchedAt);
    if (Number.isNaN(lastTouched.getTime())) {
      return 'No touch recorded';
    }

    const now = new Date();
    const diffMs = now.getTime() - lastTouched.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (days <= 0) {
      return 'Touched today';
    }

    if (days === 1) {
      return 'Touched yesterday';
    }

    return `Touched ${days} days ago`;
  }

  public getTouchCadenceHint(goal: Goal): string | null {
    if (!goal.lastTouchedAt) {
      return null;
    }

    const lastTouched = new Date(goal.lastTouchedAt);
    if (Number.isNaN(lastTouched.getTime())) {
      return null;
    }

    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - lastTouched.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (goal.minimumTouchFrequency) {
      case 'daily':
        return diffDays >= 1 ? 'Behind daily rhythm' : null;
      case '3x_week':
        return diffDays >= 3 ? 'Ready for another touch' : null;
      case 'weekly':
        return diffDays >= 7 ? 'Over weekly rhythm' : null;
      case 'biweekly':
        return diffDays >= 14 ? 'Over biweekly rhythm' : null;
      case 'monthly':
        return diffDays >= 30 ? 'Over monthly rhythm' : null;
      case 'seasonal':
      default:
        return null;
    }
  }

  private loadInitialReviewDraft(): void {
    this.initialReviewState$.subscribe({
      next: state => {
        if (state.data && !this.reviewDraftSubject.value) {
          const clonedReview = this.cloneReview(state.data);
          this.lastSavedReview = this.cloneReview(clonedReview);
          this.reviewDraftSubject.next(clonedReview);
        }
      }
    });
  }

  private computeHasUnsavedChanges(review: WeeklyReviewState | null): boolean {
    if (!review || !this.lastSavedReview) {
      return false;
    }

    return !this.areReviewsEqual(review, this.lastSavedReview);
  }

  private cloneReview(review: WeeklyReviewState): WeeklyReviewState {
    return {
      ...review,
      anchorGoalIds: [...review.anchorGoalIds],
      maintenanceGoalIds: [...review.maintenanceGoalIds]
    };
  }

  private areReviewsEqual(a: WeeklyReviewState, b: WeeklyReviewState): boolean {
    return (
      a.infrastructureGoalId === b.infrastructureGoalId &&
      a.creativeGoalId === b.creativeGoalId &&
      (a.notes ?? '') === (b.notes ?? '') &&
      this.areStringArraysEqual(a.anchorGoalIds, b.anchorGoalIds) &&
      this.areStringArraysEqual(a.maintenanceGoalIds, b.maintenanceGoalIds)
    );
  }

  private areStringArraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((value, index) => value === b[index]);
  }
}