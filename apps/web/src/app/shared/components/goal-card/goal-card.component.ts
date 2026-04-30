import { Component, Input } from '@angular/core';
import { GoalRoadmapStatus, RoadmapGoalStatus } from 'src/app/core/models/goal-roadmap-status.model';
import { Goal } from 'src/app/core/models/goal.model';

@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent {
  @Input() goal!: Goal;
  @Input() roadmapStatusByGoalId!: Record<string, GoalRoadmapStatus>;

  public getDisplayLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

  get dueLabel(): string | null {
    if (this.goal.realDeadline) {
      return `Deadline: ${this.goal.realDeadline}`;
    }

    if (this.goal.targetDate) {
      return `Target: ${this.goal.targetDate}`;
    }

    return null;
  }

  get hasMeta(): boolean {
    return !!(
      this.goal.minimumTouchFrequency ||
      this.goal.typicalSessionSize ||
      this.goal.energy ||
      this.goal.resistance ||
      this.goal.excitement
    );
  }

  public getRoadmapBadgeClass(planningState: RoadmapGoalStatus): string {
    switch (planningState) {
      case 'has_remaining_tasks':
        return 'goal-roadmap-badge--ready';

      case 'all_tasks_complete':
        return 'goal-roadmap-badge--review';

      case 'no_tasks':
      case 'no_active_milestone':
        return 'goal-roadmap-badge--planning';

      default:
        return '';
    }
  }

  public getRoadmapBadgeLabel(planningState: RoadmapGoalStatus): string {
    switch (planningState) {
      case 'no_active_milestone':
        return 'Needs milestone';

      case 'no_tasks':
        return 'Needs tiny task';

      case 'all_tasks_complete':
        return 'Review milestone';

      case 'has_remaining_tasks':
        return 'Ready for action';
    }
  }
}