import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { GoalSurfacingService } from 'src/app/core/services/goal-surfacing.service';
import { WeeklyInsightService } from 'src/app/core/services/weekly-insights.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';

@Component({
  selector: 'app-weekly-review-page',
  templateUrl: './weekly-review-page.component.html',
  styleUrls: ['./weekly-review-page.component.scss']
})
export class WeeklyReviewPageComponent implements OnInit {
  public goals: Goal[] = [];
  public review!: WeeklyReviewState;
  public weeklyInsights = this.weeklyInsightService.getLast7DaysInsights();

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private goalSurfacingService: GoalSurfacingService,
    private weeklyInsightService: WeeklyInsightService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewStoreService.getCurrentWeeklyReview();
  }

  public save(): void {
    this.weeklyReviewStoreService.saveWeeklyReview(this.review);
  }

  public reset(): void {
    this.review = this.weeklyReviewStoreService.resetWeeklyReview();
  }

  public isAnchorSelected(goalId: string): boolean {
    return this.review.anchorGoalIds.includes(goalId);
  }

  public toggleAnchor(goalId: string): void {
    if (this.isAnchorSelected(goalId)) {
      this.review.anchorGoalIds = this.review.anchorGoalIds.filter(id => id !== goalId);
      return;
    }

    if (this.review.anchorGoalIds.length < 2) {
      this.review.anchorGoalIds = [...this.review.anchorGoalIds, goalId];
    }
  }

  public isMaintenanceSelected(goalId: string): boolean {
    return this.review.maintenanceGoalIds.includes(goalId);
  }

  public toggleMaintenance(goalId: string): void {
    if (this.isMaintenanceSelected(goalId)) {
      this.review.maintenanceGoalIds = this.review.maintenanceGoalIds.filter(id => id !== goalId);
      return;
    }

    if (this.review.maintenanceGoalIds.length < 5) {
      this.review.maintenanceGoalIds = [...this.review.maintenanceGoalIds, goalId];
    }
  }

  public trackByGoalId(index: number, goal: Goal): string {
    return goal.id;
  }

  public get activeGoals(): Goal[] {
    return this.goals.filter(goal => goal.status === 'active');
  }

public get anchorCandidates(): Goal[] {
  const candidates = this.activeGoals.filter(goal => goal.type !== 'maintain');
  return this.goalSurfacingService.sortGoalsBySurfacing(candidates, this.review);
}

public get maintenanceCandidates(): Goal[] {
  const candidates = this.activeGoals.filter(goal => goal.type === 'maintain');
  return this.goalSurfacingService.sortGoalsBySurfacing(candidates, this.review);
}

public get infrastructureCandidates(): Goal[] {
  const candidates = this.activeGoals.filter(goal =>
    goal.type === 'maintain' ||
    [
      'life_systems',
      'money_admin',
      'home_environment',
      'community_tools',
      'mobility_transportation'
    ].includes(goal.lane)
  );

  return this.goalSurfacingService.sortGoalsBySurfacing(candidates, this.review);
}

public get creativeCandidates(): Goal[] {
  const candidates = this.activeGoals.filter(goal =>
    goal.type === 'exploration' ||
    goal.lane === 'creative_experiments'
  );

  return this.goalSurfacingService.sortGoalsBySurfacing(candidates, this.review);
}

  public getGoalTitle(goalId: string | null | undefined): string {
    if (!goalId) return '';
    return this.goals.find(goal => goal.id === goalId)?.title ?? '';
  }

  public get selectedAnchorGoals(): Goal[] {
    return this.goals.filter(goal => this.review.anchorGoalIds.includes(goal.id));
  }

  public get selectedMaintenanceGoals(): Goal[] {
    return this.goals.filter(goal => this.review.maintenanceGoalIds.includes(goal.id));
  }

  public get selectedInfrastructureGoal(): Goal | null {
    if (!this.review.infrastructureGoalId) return null;
    return this.goals.find(goal => goal.id === this.review.infrastructureGoalId) ?? null;
  }

  public get selectedCreativeGoal(): Goal | null {
    if (!this.review.creativeGoalId) return null;
    return this.goals.find(goal => goal.id === this.review.creativeGoalId) ?? null;
  }

  public isAnchorDisabled(goalId: string): boolean {
  return !this.isAnchorSelected(goalId) && this.review.anchorGoalIds.length >= 2;
  }

  public isMaintenanceDisabled(goalId: string): boolean {
    return !this.isMaintenanceSelected(goalId) && this.review.maintenanceGoalIds.length >= 5;
  }

  public getSurfacingScore(goal: Goal): number {
    return this.goalSurfacingService.getSurfacingScore(goal, this.review);
  }

  public getSuggestedCategory(goal: Goal): string | null {
    return this.goalSurfacingService.getSuggestedDailyCategory(goal, this.review);
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
}