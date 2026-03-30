import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { WeeklyReviewService } from 'src/app/core/services/weekly-review.service';

@Component({
  selector: 'app-weekly-review-page',
  templateUrl: './weekly-review-page.component.html',
  styleUrls: ['./weekly-review-page.component.scss']
})
export class WeeklyReviewPageComponent implements OnInit {
  public goals: Goal[] = [];
  public review!: WeeklyReviewState;

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewService: WeeklyReviewService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewService.getCurrentWeeklyReview();
  }

  public save(): void {
    this.weeklyReviewService.saveWeeklyReview(this.review);
  }

  public reset(): void {
    this.review = this.weeklyReviewService.resetWeeklyReview();
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

  public get infrastructureCandidates(): Goal[] {
    return this.activeGoals;
  }

  public get creativeCandidates(): Goal[] {
    return this.activeGoals.filter(goal => goal.type === 'exploration');
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
}