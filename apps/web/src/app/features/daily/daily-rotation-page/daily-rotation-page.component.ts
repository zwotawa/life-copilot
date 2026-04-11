import { Component, OnInit } from '@angular/core';
import { DailyRotationItem } from 'src/app/core/models/daily-rotation.model';
import { PlanningWorkflowService } from 'src/app/core/services/planning-workflow.service';

@Component({
  selector: 'app-daily-rotation-page',
  templateUrl: './daily-rotation-page.component.html',
  styleUrls: ['./daily-rotation-page.component.scss']
})
export class DailyRotationPageComponent implements OnInit {
  public rotationItems: DailyRotationItem[] = [];
  public activeCompletionDays: number = 0;

  constructor(
    private planningWorkflowService: PlanningWorkflowService
  ) {}

  ngOnInit(): void {
    this.loadDailySelections();
  }

  public get completedCount(): number {
    return this.rotationItems.filter(item => item.completed).length;
  }

  public get totalCount(): number {
    return this.rotationItems.length;
  }

  public get completionPercent(): number {
    if (this.totalCount === 0) {
      return 0;
    }

    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  public get isDayComplete(): boolean {
    return this.totalCount > 0 && this.completedCount === this.totalCount;
  }

  public get progressMessage(): string {
    if (this.totalCount === 0) {
      return 'No items planned for today.';
    }

    if (this.isDayComplete) {
      return 'Done for today.';
    }

    if (this.completedCount === 0) {
      return 'Ready to get started.';
    }

    return `${this.completedCount} of ${this.totalCount} completed.`;
  }

  public generateDailyRotation(): void {
    this.planningWorkflowService.refreshTodayPlan().subscribe({
      next: dailyRotationItems => this.rotationItems = dailyRotationItems
    });
  }

  public toggleCompleted(item: DailyRotationItem): void {
    this.planningWorkflowService.toggleRotationItemCompleted(item.id).subscribe({
      next: dailyRotationItems => this.rotationItems = dailyRotationItems
    });
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

  public replaceItem(item: DailyRotationItem): void {
    this.planningWorkflowService.replaceRotationItem(item.id).subscribe({
      next: replacementItems => this.rotationItems = replacementItems
    });
  }

  private loadDailySelections(): void {
    this.planningWorkflowService.getOrCreateDailyRotation().subscribe({
      next: rotationItems => this.rotationItems = rotationItems
    });
    this.planningWorkflowService.getLastSevenDaysCompletions().subscribe({
      next: completions => this.activeCompletionDays = completions
    });
  }
}