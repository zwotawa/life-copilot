import { Component } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { InboxEntry } from 'src/app/core/models/inbox-entry.model';
import {
  GoalFreshnessInfo,
  GoalFreshnessService
} from 'src/app/core/services/goal-freshness.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';
import { PlanningWorkflowService } from 'src/app/core/services/planning-workflow.service';
import { DashboardExecutionSnapshot } from 'src/app/core/models/dashboard-execution-snapshot.model';
import { DashboardInsightService } from 'src/app/core/services/dashboard-insight.service';
import { Loadable } from 'src/app/core/models/loadable.model';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';
import { GoalInsightsSnapshot } from 'src/app/core/models/goal-insights.model';
import { GoalInsightsService } from 'src/app/core/services/goal-insights.service';

interface GoalFreshnessView {
  goal: Goal;
  freshness: GoalFreshnessInfo;
}

interface InboxSummaryView {
  activeInboxCount: number;
  newInboxCount: number;
  clarifiedInboxCount: number;
  deferredInboxCount: number;
  recentInboxEntries: InboxEntry[];
}

interface DashboardViewModel {
  goalsState: Loadable<Goal[]>;
  reviewState: Loadable<WeeklyReviewState>;
  dailyRotationState: Loadable<DailyRotationItem[]>;
  inboxState: Loadable<InboxSummaryView>;
  executionSnapshotState: Loadable<DashboardExecutionSnapshot>;

  goals: Goal[];
  review: WeeklyReviewState | null;
  dailyRotationItems: DailyRotationItem[];
  inboxSummary: InboxSummaryView | null;
  executionSnapshot: DashboardExecutionSnapshot | null;

  activeGoals: Goal[];
  activeGoalCount: number;
  projectGoalCount: number;
  maintainGoalCount: number;
  explorationGoalCount: number;

  selectedAnchorGoalViews: GoalFreshnessView[];
  selectedMaintenanceGoalViews: GoalFreshnessView[];
  selectedInfrastructureGoalView: GoalFreshnessView | null;
  selectedCreativeGoalView: GoalFreshnessView | null;

  goalsMissingMilestoneViews: GoalFreshnessView[];
  goalsMissingNextActionViews: GoalFreshnessView[];
  deadlineGoalViews: GoalFreshnessView[];

  staleGoalCount: number;
  overRhythmGoalCount: number;
  untouchedGoalCount: number;

  goalInsights: GoalInsightsSnapshot;

  pageLoading: boolean;
  pageErrorMessages: string[];
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent {
  public readonly goalsState$: Observable<Loadable<Goal[]>> =
    toLoadable(this.goalStoreService.getGoals(), 'Could not load goals.');

  public readonly reviewState$: Observable<Loadable<WeeklyReviewState>> =
    toLoadable(this.weeklyReviewStoreService.getCurrentWeeklyReview(), 'Could not load weekly review.');

  public readonly dailyRotationState$: Observable<Loadable<DailyRotationItem[]>> =
    toLoadable(this.planningWorkflowService.getOrCreateDailyRotation(), 'Could not load today’s menu.');

  public readonly executionSnapshotState$: Observable<Loadable<DashboardExecutionSnapshot>> =
  toLoadable(this.dashboardInsightService.getExecutionSnapshot(), 'Could not load execution snapshot.');

  public readonly inboxState$: Observable<Loadable<InboxSummaryView>> =
    this.inboxService.getEntries().pipe(
      map(entries => this.buildInboxSummary(entries)),
      map(summary => ({
        loading: false,
        data: summary,
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
          error: 'Could not load inbox summary.'
        })
      ),
      shareReplay(1)
    );

  public readonly vm$: Observable<DashboardViewModel> = combineLatest([
    this.goalsState$,
    this.reviewState$,
    this.dailyRotationState$,
    this.inboxState$,
    this.executionSnapshotState$
  ]).pipe(
    map(([goalsState, reviewState, dailyRotationState, inboxState, executionSnapshotState]) => {
      const goals = goalsState.data ?? [];
      const review = reviewState.data;
      const dailyRotationItems = dailyRotationState.data ?? [];
      const inboxSummary = inboxState.data;
      const executionSnapshot = executionSnapshotState.data;
      const activeGoals = goals.filter(goal => goal.status === 'active');

      const goalInsights = this.goalInsightsService.getSnapshot(goals);

      const selectedAnchorGoals = review
        ? activeGoals.filter(goal => review.anchorGoalIds.includes(goal.id))
        : [];

      const selectedMaintenanceGoals = review
        ? activeGoals.filter(goal => review.maintenanceGoalIds.includes(goal.id))
        : [];

      const selectedInfrastructureGoal = review
        ? activeGoals.find(goal => goal.id === review.infrastructureGoalId) ?? null
        : null;

      const selectedCreativeGoal = review
        ? activeGoals.find(goal => goal.id === review.creativeGoalId) ?? null
        : null;

      const goalsMissingMilestone = activeGoals
        .filter(goal => !goal.currentMilestone?.trim())
        .slice(0, 5);

      const goalsMissingNextAction = activeGoals
        .filter(goal => !goal.nextTinyAction?.trim())
        .slice(0, 5);

      const deadlineGoals = activeGoals
        .filter(goal => goal.dueStyle !== 'cadence_only')
        .slice(0, 5);

      const staleGoalCount = activeGoals.filter(goal => {
        const info = this.goalFreshnessService.getFreshnessInfo(goal);
        return info.daysSinceTouched !== null && info.daysSinceTouched >= 7;
      }).length;

      const overRhythmGoalCount = activeGoals.filter(goal =>
        this.goalFreshnessService.isOverRhythm(goal)
      ).length;

      const untouchedGoalCount = activeGoals.filter(goal => !goal.lastTouchedAt).length;

      const pageErrorMessages = [
        goalsState.error,
        reviewState.error,
        dailyRotationState.error,
        inboxState.error,
        executionSnapshotState.error
      ].filter((message): message is string => !!message);

      return {
        goalsState,
        reviewState,
        dailyRotationState,
        inboxState,
        executionSnapshotState,

        goals,
        review,
        dailyRotationItems,
        inboxSummary,
        executionSnapshot,

        activeGoals,
        activeGoalCount: activeGoals.length,
        projectGoalCount: activeGoals.filter(goal => goal.type === 'project').length,
        maintainGoalCount: activeGoals.filter(goal => goal.type === 'maintain').length,
        explorationGoalCount: activeGoals.filter(goal => goal.type === 'exploration').length,

        selectedAnchorGoalViews: selectedAnchorGoals.map(goal => this.toGoalFreshnessView(goal)),
        selectedMaintenanceGoalViews: selectedMaintenanceGoals.map(goal => this.toGoalFreshnessView(goal)),
        selectedInfrastructureGoalView: selectedInfrastructureGoal
          ? this.toGoalFreshnessView(selectedInfrastructureGoal)
          : null,
        selectedCreativeGoalView: selectedCreativeGoal
          ? this.toGoalFreshnessView(selectedCreativeGoal)
          : null,

        goalsMissingMilestoneViews: goalsMissingMilestone.map(goal => this.toGoalFreshnessView(goal)),
        goalsMissingNextActionViews: goalsMissingNextAction.map(goal => this.toGoalFreshnessView(goal)),
        deadlineGoalViews: deadlineGoals.map(goal => this.toGoalFreshnessView(goal)),

        staleGoalCount,
        overRhythmGoalCount,
        untouchedGoalCount,
        goalInsights,

        pageLoading:
          goalsState.loading ||
          reviewState.loading ||
          dailyRotationState.loading ||
          inboxState.loading ||
          executionSnapshotState.loading,

        pageErrorMessages
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly weeklyReviewStoreService: WeeklyReviewStoreService,
    private readonly inboxService: InboxStoreService,
    private readonly goalFreshnessService: GoalFreshnessService,
    private readonly planningWorkflowService: PlanningWorkflowService,
    private readonly dashboardInsightService: DashboardInsightService,
    private readonly goalInsightsService: GoalInsightsService
  ) {}

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

  public trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }

  public trackByRotationId(index: number, item: DailyRotationItem): string {
    return item.id;
  }

  public trackByInboxId(index: number, entry: InboxEntry): string {
    return entry.id;
  }

  public trackByGoalViewId(index: number, item: GoalFreshnessView): string {
    return item.goal.id;
  }

  public getGoalFreshnessLabel(goal: Goal): string {
    return this.goalFreshnessService.getLabel(goal);
  }

  public getGoalFreshness(goal: Goal): GoalFreshnessInfo {
    return this.goalFreshnessService.getFreshnessInfo(goal);
  }

  public getGoalClass(goalId: string | null, goals: Goal[]): string {
    const goal = goals.find(g => g.id === goalId);
    return goal
      ? 'dashboard-rotation-item__meta--' + this.getGoalFreshness(goal).tone
      : '';
  }

  public findGoalById(goalId: string | null, goals: Goal[]): Goal | null {
    if (!goalId) return null;
    return goals.find(goal => goal.id === goalId) ?? null;
  }

  private toGoalFreshnessView(goal: Goal): GoalFreshnessView {
    return {
      goal,
      freshness: this.goalFreshnessService.getFreshnessInfo(goal)
    };
  }

  private buildInboxSummary(entries: InboxEntry[]): InboxSummaryView {
    const activeEntries = entries.filter(
      entry => entry.status !== 'archived' && entry.status !== 'deferred'
    );

    return {
      activeInboxCount: activeEntries.length,
      newInboxCount: activeEntries.filter(entry => entry.status === 'new').length,
      clarifiedInboxCount: activeEntries.filter(entry => entry.status === 'clarified').length,
      deferredInboxCount: activeEntries.filter(entry => entry.status === 'deferred').length,
      recentInboxEntries: activeEntries
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3)
    };
  }
}