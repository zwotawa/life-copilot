import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { WeeklyReviewState } from 'src/app/core/models/weekly-review.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';
import { RotationEngineService } from 'src/app/core/services/rotation-engine.service';
import { WeeklyReviewService } from 'src/app/core/services/weekly-review.service';

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
    private weeklyReviewService: WeeklyReviewService,
    private rotationEngineService: RotationEngineService
  ) {}

  ngOnInit(): void {
    this.goals = this.goalStoreService.getGoals();
    this.review = this.weeklyReviewService.getCurrentWeeklyReview();
    this.generateDailyRotation();
  }

  public generateDailyRotation(): void {
    this.rotationItems = this.rotationEngineService.generateDailyRotation(
      this.goals,
      this.review
    );
  }

  public toggleCompleted(item: DailyRotationItem): void {
    item.completed = !item.completed;
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
}