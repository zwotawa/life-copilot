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

  constructor(
    private planningWorkflowService: PlanningWorkflowService
  ) {}

  ngOnInit(): void {
    this.loadDailySelections();
  }

  public generateDailyRotation(): void {
    this.rotationItems = this.planningWorkflowService.regenerateDailyRotation();
  }

  public toggleCompleted(item: DailyRotationItem): void {
  this.rotationItems = this.planningWorkflowService.toggleRotationItemCompleted(item.id);
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

  private loadDailySelections(): void {
    this.rotationItems = this.planningWorkflowService.getOrCreateDailyRotation();
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}