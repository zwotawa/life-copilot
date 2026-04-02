import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { RotationEngineService } from 'src/app/core/services/rotation-engine.service';
import { WeeklyReviewService } from 'src/app/core/services/weekly-review.service';
import { InboxEntry } from 'src/app/core/models/inbox-entry.model';
import { GoalFreshnessInfo, GoalFreshnessService } from 'src/app/core/services/goal-freshness.service';
import { GoalStoreService } from 'src/app/core/repositories/goal-store.service';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';


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
  public dailyRotation: DailyRotationItem[] = [];

  public activeInboxCount = 0;
  public newInboxCount = 0;
  public clarifiedInboxCount = 0;
  public deferredInboxCount = 0;
  public recentInboxEntries: InboxEntry[] = [];


  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewService: WeeklyReviewService,
    private rotationEngineService: RotationEngineService,
    private inboxService: InboxStoreService,
    private goalFreshnessService: GoalFreshnessService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewService.getCurrentWeeklyReview();
    this.loadDailySelections();
    this.loadInboxSummary();
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
    const saved = this.rotationEngineService.loadRotationItems();

    if (saved) {
      this.dailyRotation = saved;
      return;
    }

    // Optional: only do this if you want a first-time auto-generate
    this.dailyRotation = this.rotationEngineService.generateDailyRotation(this.goals, this.review);
    this.rotationEngineService.saveRotationItems(this.dailyRotation);
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

}