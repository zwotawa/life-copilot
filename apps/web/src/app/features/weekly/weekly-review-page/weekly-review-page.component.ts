import { Component } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { finalize, map, shareReplay, startWith } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { Loadable } from 'src/app/core/models/loadable.model';
import { WeeklyExecutionInsights } from 'src/app/core/models/weekly-execution-insights.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { GoalBehaviorEvidence, GoalSurfacingResult, GoalSurfacingService } from 'src/app/core/services/goal-surfacing.service';
import { WeeklyInsightService } from 'src/app/core/services/weekly-insights.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { GoalProgressEvent } from 'src/app/core/models/goal-progress-event.model';
import { GoalProgressStoreService } from 'src/app/core/services/goal-progress-store.service';
import { GoalInsightsService } from 'src/app/core/services/goal-insights.service';

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
  private evidenceByGoalId: Record<string, GoalBehaviorEvidence> = {};
  public showSurfacingDebug: boolean = true;

  private readonly goalsState$: Observable<Loadable<Goal[]>> =
    toLoadable(this.goalStoreService.getGoals(), 'Could not load goals.');

  private readonly reviewState$: Observable<Loadable<WeeklyReviewState>> =
    toLoadable(this.weeklyReviewStoreService.getCurrentWeeklyReview(), 'Could not load weekly review.');

  private readonly insightsState$: Observable<Loadable<WeeklyExecutionInsights | null>> =
    toLoadable(this.weeklyInsightService.getLast7DaysInsights(), 'Could not load weekly execution insights.');

  private readonly progressEventsState$: Observable<Loadable<GoalProgressEvent[]>> =
    toLoadable(this.goalProgressStoreService.getAllEvents(), 'Could not load progress evidence.');

  public isSaving = false;
  public saveError: string | null = null;

  public isResetting = false;
  public resetError: string | null = null;

  public readonly vm$: Observable<WeeklyReviewViewModel> = combineLatest([
    this.goalsState$,
    this.reviewState$,
    this.insightsState$,
    this.reviewDraft$,
    this.progressEventsState$
  ]).pipe(
    map(([goalsState, reviewState, insightsState, reviewDraft, progressEventsState]) => {
      const goals = goalsState.data ?? [];
      const review = reviewDraft ?? reviewState.data ?? null;
      const weeklyInsights = insightsState.data ?? null;
      const activeGoals = goals.filter(goal => goal.status === 'active');
      const progressEvents = progressEventsState.data ?? [];
      const evidenceByGoalId = this.goalInsightsService.buildEvidenceByGoalId(progressEvents);
      this.evidenceByGoalId = evidenceByGoalId;

      const anchorCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal => goal.type !== 'maintain'),
            review,
            evidenceByGoalId
          )
        : [];

      const maintenanceCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal => goal.type === 'maintain'),
            review,
            evidenceByGoalId
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
            review,
            evidenceByGoalId
          )
        : [];

      const creativeCandidates = review
        ? this.goalSurfacingService.sortGoalsBySurfacing(
            activeGoals.filter(goal =>
              goal.type === 'exploration' ||
              goal.lane === 'creative_experiments'
            ),
            review,
            evidenceByGoalId
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
        progressEventsState.error,
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

        hasUnsavedChanges: this.hasUnsavedChanges,

        pageLoading:
          goalsState.loading ||
          reviewState.loading ||
          insightsState.loading ||
          progressEventsState.loading,

        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly weeklyReviewStoreService: WeeklyReviewStoreService,
    private readonly goalSurfacingService: GoalSurfacingService,
    private readonly weeklyInsightService: WeeklyInsightService,
    private notificationService: NotificationService,
    private goalProgressStoreService: GoalProgressStoreService,
    private goalInsightsService: GoalInsightsService
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
        this.notificationService.success('Weekly review saved.');
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
        this.notificationService.success('Weekly review reset.');
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

    return this.goalSurfacingService.getSurfacingScore(
      goal, 
      reviewDraft,
      this.evidenceByGoalId[goal.id] ?? null);
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

  public get hasUnsavedChanges(): boolean {
    const reviewDraft = this.reviewDraftSubject.value;
    return this.computeHasUnsavedChanges(reviewDraft);
  }

  public canDeactivate(): boolean {
    if (!this.hasUnsavedChanges) {
      return true;
    }

    return window.confirm(
      'You have unsaved changes on your weekly review. Leave this page and lose those changes?'
    );
  }

  public getSurfacingReasons(goal: Goal): string {
    if (!this.reviewDraftSubject.value) {
      return '';
    }

    const result = this.goalSurfacingService.getSurfacingResult(
      goal,
      this.reviewDraftSubject.value,
      this.evidenceByGoalId[goal.id] ?? null
    );

    return result.reasons.slice(0, 3).join(' · ');
  }

  public getSurfacingResult(goal: Goal): GoalSurfacingResult | null {
    const review = this.reviewDraftSubject.value;

    if (!review) {
      return null;
    }

    return this.goalSurfacingService.getSurfacingResult(
      goal,
      review,
      this.evidenceByGoalId[goal.id] ?? null
    );
  }

  public getSurfacingBreakdownEntries(goal: Goal): { label: string; value: number }[] {
    const result = this.getSurfacingResult(goal);

    if (!result) {
      return [];
    }

    const factors = result.factorBreakdown;

    return [
      { label: 'Status', value: factors.statusWeight },
      { label: 'Frequency', value: factors.frequencyWeight },
      { label: 'Freshness', value: factors.freshnessWeight },
      { label: 'Due', value: factors.dueWeight },
      { label: 'Weekly', value: factors.weeklySelectionWeight },
      { label: 'Excitement', value: factors.excitementWeight },
      { label: 'Momentum', value: factors.recentMomentumWeight },
      { label: 'No progress', value: factors.noProgressWeight },
      { label: 'Resistance', value: -factors.resistancePenalty },
      { label: 'Over-served', value: -factors.overServedPenalty }
    ];
  }

  private loadInitialReviewDraft(): void {
    this.reviewState$.subscribe({
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