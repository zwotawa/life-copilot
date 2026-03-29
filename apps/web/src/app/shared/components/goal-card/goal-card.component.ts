import { Component, Input } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';

@Component({
  selector: 'app-goal-card',
  templateUrl: './goal-card.component.html',
  styleUrls: ['./goal-card.component.scss']
})
export class GoalCardComponent {
  @Input() goal!: Goal;

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
}