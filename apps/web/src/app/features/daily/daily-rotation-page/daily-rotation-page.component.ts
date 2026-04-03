import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { DailyRotationStoreService } from 'src/app/core/services/daily-rotation-store.service';
import { WeeklyReviewStoreService } from 'src/app/core/services/weekly-review-store.service';

@Component({
  selector: 'app-daily-rotation-page',
  templateUrl: './daily-rotation-page.component.html',
  styleUrls: ['./daily-rotation-page.component.scss']
})
export class DailyRotationPageComponent implements OnInit {
  public goals: Goal[] = [];
  public review!: WeeklyReviewState;
  public rotationItems: DailyRotationItem[] = [];

  constructor(
    private goalStoreService: GoalStoreService,
    private weeklyReviewStoreService: WeeklyReviewStoreService,
    private dailyRotationStoreService: DailyRotationStoreService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewStoreService.getCurrentWeeklyReview();
    this.loadDailySelections();
  }

  public generateDailyRotation(): void {
    this.rotationItems = this.dailyRotationStoreService.generateDailyRotation(
      this.goals,
      this.review
    );
  }

  public toggleCompleted(item: DailyRotationItem): void {
    const wasCompleted = item.completed;
    item.completed = !item.completed;

    this.dailyRotationStoreService.saveRotationItems(this.rotationItems);

    if (!wasCompleted && item.completed && item.goalId) {
      this.goalStoreService.markGoalTouched(item.goalId);
    }
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

  public getCategoryDescription(category: DailyRotationItem['category']): string {
    switch (category) {
      case 'responsible':
        return 'A practical move that keeps life from drifting.';
      case 'momentum':
        return 'A meaningful step on an important goal.';
      case 'maintenance':
        return 'A light touch that keeps the system alive.';
      case 'interesting':
        return 'Something energizing or creatively alive.';
      case 'fallback':
        return 'A very easy move for scattered or low-energy moments.';
      default:
        return '';
    }
  }

  public trackByItemId(index: number, item: DailyRotationItem): string {
    return item.id;
  }

  loadDailySelections(): void {
    const saved = this.dailyRotationStoreService.loadRotationItems();

    if (saved) {
      this.rotationItems = saved;
      return;
    }

    // Optional: only do this if you want a first-time auto-generate
    this.rotationItems = this.dailyRotationStoreService.generateDailyRotation(this.goals, this.review);
    this.dailyRotationStoreService.saveRotationItems(this.rotationItems);
  }
}