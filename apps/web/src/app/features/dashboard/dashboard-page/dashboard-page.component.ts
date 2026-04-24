import { Component } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith, switchMap } from 'rxjs/operators';

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
import { GoalProgressEvent } from 'src/app/core/models/goal-progress-event.model';
import { GoalProgressStoreService } from 'src/app/core/services/goal-progress-store.service';
import { GoalMilestoneStoreService } from 'src/app/core/services/goal-milestone-store.service';
import { GoalRoadmapInsightsService } from 'src/app/core/services/goal-roadmap-insights.service';
import { GoalTinyTaskStoreService } from 'src/app/core/services/goal-tiny-task-store.service';
import { GoalMilestone } from 'src/app/core/models/goal-milestone.model';
import { GoalTinyTask } from 'src/app/core/models/goal-tiny-task.model';
import { GoalRoadmapInsights, GoalRoadmapProgressItem } from 'src/app/core/models/goal-roadmap-insights.model';

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

  roadmapInsightsState: Loadable<GoalRoadmapInsights>;
  roadmapInsights: GoalRoadmapInsights | null;

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

  public readonly progressEventsState$: Observable<Loadable<GoalProgressEvent[]>> =
    toLoadable(this.goalProgressStoreService.getAllEvents(), 'Could not load goal progress insights.');

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

    public readonly roadmapInsightsState$: Observable<Loadable<GoalRoadmapInsights>> =
      this.goalsState$.pipe(
        switchMap(goalState => {
          const goals = goalState.data ?? [];

          if (goals.length === 0) {
            return of({
              loading: false,
              data: {
                goalsWithActiveMilestonesCount: 0,
                completedMilestonesCount: 0,
                completedTinyTasksCount: 0,
                goalsNeedingPlanningCount: 0,
                activeGoalSnapshots: []
              },
              error: null
            });
          }

          return this.loadMilestonesForGoals(goals).pipe(
            switchMap(milestones =>
              this.loadTinyTasksForMilestones(milestones).pipe(
                map(tinyTasks => ({
                  loading: false,
                  data: this.goalRoadmapInsightsService.getInsights(
                    goals,
                    milestones,
                    tinyTasks
                  ),
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
                error: 'Could not load roadmap progress.'
              })
            )
          );
        }),
        shareReplay(1)
      );

  public readonly vm$: Observable<DashboardViewModel> = combineLatest([
    this.goalsState$,
    this.reviewState$,
    this.dailyRotationState$,
    this.inboxState$,
    this.executionSnapshotState$,
    this.progressEventsState$,
    this.roadmapInsightsState$
  ]).pipe(
    map(([
      goalsState, 
      reviewState, 
      dailyRotationState, 
      inboxState, 
      executionSnapshotState, 
      progressEventsState,
      roadmapInsightsState
    ]) => {
      const goals = goalsState.data ?? [];
      const review = reviewState.data;
      const dailyRotationItems = dailyRotationState.data ?? [];
      const inboxSummary = inboxState.data;
      const executionSnapshot = executionSnapshotState.data;
      const activeGoals = goals.filter(goal => goal.status === 'active');
      const roadmapInsights = roadmapInsightsState.data ?? null;

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

      const progressEvents = progressEventsState.data ?? [];
      const goalInsights = this.goalInsightsService.getSnapshot(goals, progressEvents); 

      const pageErrorMessages = [
        goalsState.error,
        reviewState.error,
        dailyRotationState.error,
        inboxState.error,
        executionSnapshotState.error,
        progressEventsState.error,
        roadmapInsightsState.error
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

        roadmapInsights,
        roadmapInsightsState,

        pageLoading:
          goalsState.loading ||
          reviewState.loading ||
          dailyRotationState.loading ||
          inboxState.loading ||
          executionSnapshotState.loading ||
          roadmapInsightsState.loading,

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
    private readonly goalInsightsService: GoalInsightsService,
    private readonly goalProgressStoreService: GoalProgressStoreService,
    private readonly goalMilestoneStoreService: GoalMilestoneStoreService,
    private readonly goalTinyTaskStoreService: GoalTinyTaskStoreService,
    private readonly goalRoadmapInsightsService: GoalRoadmapInsightsService,
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

  public trackByActiveGoalInsightId(index: number, item: { goalId: string }): string {
    return item.goalId;
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

  public getRoadmapTaskProgressLabel(item: GoalRoadmapProgressItem): string {
    if (item.totalTinyTaskCount === 0) {
      return 'No tiny tasks yet';
    }

    return `${item.completedTinyTaskCount} of ${item.totalTinyTaskCount} tiny tasks complete`;
  }

  public getRoadmapTaskProgressPercent(item: GoalRoadmapProgressItem): number {
    if (item.totalTinyTaskCount === 0) {
      return 0;
    }

    return Math.round((item.completedTinyTaskCount / item.totalTinyTaskCount) * 100);
  }

  public trackByRoadmapGoalId(index: number, item: GoalRoadmapProgressItem): string {
    return item.goalId;
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