import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { InboxEntry } from 'src/app/core/models/inbox-entry.model';
import { GoalFreshnessInfo, GoalFreshnessService } from 'src/app/core/services/goal-freshness.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';
import { DailyRotationStoreService } from 'src/app/core/services/daily-rotation-store.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';
import { PlanningWorkflowService } from 'src/app/core/services/planning-workflow.service';
import { DashboardExecutionSnapshot } from 'src/app/core/models/dashboard-execution-snapshot.model';
import { DashboardInsightService } from 'src/app/core/services/dashboard-insight.service';
import { Observable } from 'rxjs';


interface GoalFreshnessView {
  goal: Goal;
  freshness: GoalFreshnessInfo;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  public goals: Goal[] = [];
  public review!: WeeklyReviewState;
  public dailyRotation$: Observable<DailyRotationItem[]> = new Observable();

  public activeInboxCount = 0;
  public newInboxCount = 0;
  public clarifiedInboxCount = 0;
  public deferredInboxCount = 0;
  public recentInboxEntries: InboxEntry[] = [];
  public executionSnapshot: DashboardExecutionSnapshot | null = null;


  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private inboxService: InboxStoreService,
    private goalFreshnessService: GoalFreshnessService,
    private planningWorkflowService: PlanningWorkflowService,
    private readonly dashboardInsightService: DashboardInsightService
  ) {}

  ngOnInit(): void {
    this.extractGoals();
    this.review = this.weeklyReviewStoreService.getCurrentWeeklyReview();
    this.loadDailySelections();
    this.loadInboxSummary();
    this.loadExecutionSnapshot();
  }

  public get activeGoals(): Goal[] {
    return this.goals.filter(goal => goal.status === 'active');
  }

  public get activeGoalCount(): number {
    return this.activeGoals.length;
  }

  public get projectGoalCount(): number {
    return this.activeGoals.filter(goal => goal.type === 'project').length;
  }

  public get maintainGoalCount(): number {
    return this.activeGoals.filter(goal => goal.type === 'maintain').length;
  }

  public get explorationGoalCount(): number {
    return this.activeGoals.filter(goal => goal.type === 'exploration').length;
  }

  public get selectedAnchorGoals(): Goal[] {
    return this.activeGoals.filter(goal => this.review.anchorGoalIds.includes(goal.id));
  }

  public get selectedMaintenanceGoals(): Goal[] {
    return this.activeGoals.filter(goal => this.review.maintenanceGoalIds.includes(goal.id));
  }

  public get selectedInfrastructureGoal(): Goal | null {
    if (!this.review.infrastructureGoalId) return null;
    return this.activeGoals.find(goal => goal.id === this.review.infrastructureGoalId) ?? null;
  }

  public get selectedCreativeGoal(): Goal | null {
    if (!this.review.creativeGoalId) return null;
    return this.activeGoals.find(goal => goal.id === this.review.creativeGoalId) ?? null;
  }

  public get goalsMissingMilestone(): Goal[] {
    return this.activeGoals.filter(goal => !goal.currentMilestone?.trim()).slice(0, 5);
  }

  public get goalsMissingNextAction(): Goal[] {
    return this.activeGoals.filter(goal => !goal.nextTinyAction?.trim()).slice(0, 5);
  }

  public get deadlineGoals(): Goal[] {
    return this.activeGoals
      .filter(goal => goal.dueStyle !== 'cadence_only')
      .slice(0, 5);
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

  public trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }

  public trackByRotationId(index: number, item: DailyRotationItem): string {
    return item.id;
  }

  public  loadDailySelections(): void {
    this.dailyRotation$ = this.planningWorkflowService.getOrCreateDailyRotation();
  }

  public loadInboxSummary(): void {
    const allInboxEntries = this.inboxService.getEntries();
    const activeEntries = allInboxEntries.filter(entry => entry.status !== 'archived' && entry.status !== 'deferred');

    this.activeInboxCount = activeEntries.length;
    this.newInboxCount = activeEntries.filter(entry => entry.status === 'new').length;
    this.clarifiedInboxCount = activeEntries.filter(entry => entry.status === 'clarified').length;
    this.deferredInboxCount = activeEntries.filter(entry => entry.status === 'deferred').length;

    this.recentInboxEntries = activeEntries
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3);
  }

  trackByInboxId(index: number, entry: InboxEntry): string {
    return entry.id;
  }

  public getGoalFreshnessLabel(goal: Goal): string {
    return this.goalFreshnessService.getLabel(goal);
  }

  public toGoalFreshnessView(goal: Goal): GoalFreshnessView {
    return {
      goal,
      freshness: this.goalFreshnessService.getFreshnessInfo(goal)
    };
  }

  public get selectedAnchorGoalViews(): GoalFreshnessView[] {
    return this.selectedAnchorGoals.map(goal => this.toGoalFreshnessView(goal));
  }

  public get selectedMaintenanceGoalViews(): GoalFreshnessView[] {
    return this.selectedMaintenanceGoals.map(goal => this.toGoalFreshnessView(goal));
  }

  public get selectedInfrastructureGoalView(): GoalFreshnessView | null {
    return this.selectedInfrastructureGoal
      ? this.toGoalFreshnessView(this.selectedInfrastructureGoal)
      : null;
  }

  public get selectedCreativeGoalView(): GoalFreshnessView | null {
    return this.selectedCreativeGoal
      ? this.toGoalFreshnessView(this.selectedCreativeGoal)
      : null;
  }

  public get goalsMissingMilestoneViews(): GoalFreshnessView[] {
    return this.goalsMissingMilestone.map(goal => this.toGoalFreshnessView(goal));
  }

  public get goalsMissingNextActionViews(): GoalFreshnessView[] {
    return this.goalsMissingNextAction.map(goal => this.toGoalFreshnessView(goal));
  }

  public get deadlineGoalViews(): GoalFreshnessView[] {
    return this.deadlineGoals.map(goal => this.toGoalFreshnessView(goal));
  }

  public get staleGoalCount(): number {
    return this.activeGoals.filter(goal => {
      const info = this.goalFreshnessService.getFreshnessInfo(goal);
      return info.daysSinceTouched !== null && info.daysSinceTouched >= 7;
    }).length;
  }

  public get overRhythmGoalCount(): number {
    return this.activeGoals.filter(goal =>
      this.goalFreshnessService.isOverRhythm(goal)
    ).length;
  }

  public get untouchedGoalCount(): number {
    return this.activeGoals.filter(goal => !goal.lastTouchedAt).length;
  }

  public trackByGoalViewId(index: number, item: GoalFreshnessView): string {
    return item.goal.id;
  }

  // Add a helper method to handle the lookup and function call
  getGoalClass(goalId: string | null): string {
    const goal = this.goals.find(g => g.id === goalId);
    // Ensure safe access if goal might be undefined
    return goal ? 'dashboard-rotation-item__meta--' + this.getGoalFreshness(goal).tone : '';
  }

  public findGoalById(goalId: string | null): Goal | null {
    if (!goalId) return null;
    return this.goals.find(goal => goal.id === goalId) ?? null;
  }

  public getGoalFreshness(goal: Goal): GoalFreshnessInfo {
    return this.goalFreshnessService.getFreshnessInfo(goal);
  }

  private loadExecutionSnapshot(): void {
    this.executionSnapshot = this.dashboardInsightService.getExecutionSnapshot();
  }

  private extractGoals(): void {
    this.goalStoreService.getGoals().subscribe({
      next: (goals) => this.goals = goals
    })
  }
}