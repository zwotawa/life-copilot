import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { RotationEngineService } from 'src/app/core/services/rotation-engine.service';
import { WeeklyReviewService } from 'src/app/core/services/weekly-review.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  public goals: Goal[] = [];
  public review!: WeeklyReviewState;
  public dailyRotation: DailyRotationItem[] = [];

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewService: WeeklyReviewService,
    private rotationEngineService: RotationEngineService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewService.getCurrentWeeklyReview();
    this.loadDailySelections();
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
}