import { Component, OnInit } from '@angular/core';
import { Goal, TouchFrequency } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { RotationEngineService } from 'src/app/core/services/rotation-engine.service';
import { WeeklyReviewService } from 'src/app/core/services/weekly-review.service';
import { InboxEntry } from 'src/app/core/models/inbox-entry.model';
import { InboxService } from 'src/app/core/services/inbox.service';

interface GoalFreshnessView {
  goal: Goal;
  freshnessLabel: string;
  freshnessTone: 'fresh' | 'neutral' | 'stale' | 'overdue' | 'unknown';
  daysSinceTouched: number | null;
  isOverRhythm: boolean;
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
    private inboxService: InboxService
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

 public getDaysSinceTouched(lastTouchedAt?: string | null): number | null {
    if (!lastTouchedAt) {
      return null;
    }

    const touched = new Date(lastTouchedAt);
    const today = new Date();

    const touchedStart = new Date(
      touched.getFullYear(),
      touched.getMonth(),
      touched.getDate()
    );

    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffMs = todayStart.getTime() - touchedStart.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  public isGoalOverRhythm(goal: Goal): boolean {
    const days = this.getDaysSinceTouched(goal.lastTouchedAt);
    const expectedDays = this.getTouchFrequencyDays(goal.minimumTouchFrequency);

    return days !== null && expectedDays !== null && days > expectedDays;
  }

  public getGoalFreshnessLabel(goal: Goal): string {
    const days = this.getDaysSinceTouched(goal.lastTouchedAt);

    if (days === null) {
      return 'No touch recorded';
    }

    if (days === 0) {
      return 'Touched today';
    }

    if (days === 1) {
      return 'Touched yesterday';
    }

    if (this.isGoalOverRhythm(goal)) {
      return 'Over weekly rhythm';
    }

    return `Not touched in ${days} day${days === 1 ? '' : 's'}`;
  }

  public getGoalFreshnessTone(goal: Goal): 'fresh' | 'neutral' | 'stale' | 'overdue' | 'unknown' {
    const days = this.getDaysSinceTouched(goal.lastTouchedAt);

    if (days === null) {
      return 'unknown';
    }

    if (this.isGoalOverRhythm(goal)) {
      return 'overdue';
    }

    if (days <= 1) {
      return 'fresh';
    }

    if (days >= 7) {
      return 'stale';
    }

    return 'neutral';
  }

  public toGoalFreshnessView(goal: Goal): GoalFreshnessView {
    const daysSinceTouched = this.getDaysSinceTouched(goal.lastTouchedAt);

    return {
      goal,
      freshnessLabel: this.getGoalFreshnessLabel(goal),
      freshnessTone: this.getGoalFreshnessTone(goal),
      daysSinceTouched,
      isOverRhythm: this.isGoalOverRhythm(goal)
    };
  }

  private getTouchFrequencyDays(frequency: TouchFrequency | undefined | null): number | null {
    switch (frequency) {
      case 'daily':
        return 1;
      case '3x_week':
        return 3;
      case 'weekly':
        return 7;
      case 'biweekly':
        return 14;
      case 'monthly':
        return 30;
      case 'seasonal':
        return 90;
      default:
        return null;
    }
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
      const days = this.getDaysSinceTouched(goal.lastTouchedAt);
      return days !== null && days >= 7;
    }).length;
  }

  public get overRhythmGoalCount(): number {
    return this.activeGoals.filter(goal => this.isGoalOverRhythm(goal)).length;
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
    return goal ? 'dashboard-rotation-item__meta--' + this.getGoalFreshnessTone(goal) : '';
  }

  public findGoalById(goalId: string | null): Goal | null {
    if (!goalId) return null;
    return this.goals.find(goal => goal.id === goalId) ?? null;
  }

}