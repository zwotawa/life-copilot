import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GoalProgressEvent } from 'src/app/core/models/goal-progress-event.model';
import { Goal } from 'src/app/core/models/goal.model';
import { GoalProgressStoreService } from 'src/app/core/services/goal-progress-store.service';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';

@Component({
  selector: 'app-goal-detail-page',
  templateUrl: './goal-detail-page.component.html',
  styleUrls: ['./goal-detail-page.component.scss']
})
export class GoalDetailPageComponent implements OnInit {
  private goalId: string = '';
  public goal: Goal = <Goal>{};
  public progressEvents: GoalProgressEvent[] = [];

  constructor(private route: ActivatedRoute,
    private goalStoreService: GoalStoreService,
    private goalProgressStoreService: GoalProgressStoreService
  ) { }

  ngOnInit(): void {
    this.goalId = this.extractGoalIdFromRoute();
    this.loadGoalDetails(this.goalId);
  }

  public formatEventType(type: string): string {
    switch (type) {
      case 'daily_task_completed':
        return 'Daily task completed';
      case 'daily_task_uncompleted':
        return 'Daily task uncompleted';
      case 'milestone_completed':
        return 'Milestone completed';
      case 'note':
        return 'Note';
      case 'status_changed':
        return 'Status changed';
      default:
        return type;
    }
  }

  public getEventTypeClass(type: string): string {
    switch (type) {
      case 'daily_task_completed':
        return 'goal-progress__type--completed';
      case 'daily_task_uncompleted':
        return 'goal-progress__type--uncompleted';
      case 'milestone_completed':
        return 'goal-progress__type--milestone';
      case 'note':
        return 'goal-progress__type--note';
      case 'status_changed':
        return 'goal-progress__type--status';
      default:
        return 'goal-progress__type--default';
    }
  }

  private extractGoalIdFromRoute(): string {
    return this.route.snapshot.paramMap.get('id') || '';
  }

  private loadGoalDetails(goalId: string): void {
    if(goalId === 'new') {
      this.goal = <Goal>{};
      this.progressEvents = [];
      return; 
    }
    this.goalStoreService.getGoalById(goalId).subscribe({
      next: (goal) => {
        this.goal = goal || <Goal>{}

        if (!goal?.id) {
          this.progressEvents = [];
          return;
        }

        this.loadProgressEvents(goal.id);
      }
    })
  }

  private loadProgressEvents(goalId: string): void {
    this.goalProgressStoreService.getEventsForGoal(goalId).subscribe({
      next: (events) => {
        this.progressEvents = [...events].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
      }
    });
  }

}
