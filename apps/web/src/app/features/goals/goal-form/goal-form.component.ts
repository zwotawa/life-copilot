import { Component, Input, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { addGoal, updateGoal } from 'src/app/core/services/goal-store.service';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss']
})
export class GoalFormComponent implements OnInit {

  @Input() goal: Goal = <Goal>{};

  constructor() { }

  ngOnInit(): void {
    if (!this.goal.status) this.goal.status = 'active';
    if (!this.goal.type) this.goal.type = 'project';
    if (!this.goal.dueStyle) this.goal.dueStyle = 'cadence_only';
    if (!this.goal.minimumTouchFrequency) this.goal.minimumTouchFrequency = 'weekly';
  }

  public onSubmit(goalForm: any): void {
    const now = new Date().toISOString();

    if (this.goal.id) {
      updateGoal({
        ...this.goal,
        updatedAt: now
      });
      return;
    }

    const newGoal: Goal = {
      ...this.goal,
      id: this.goal.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      createdAt: now,
      updatedAt: now
    };
    addGoal(newGoal);
  }

  get isNewGoal(): boolean {
    return !this.goal.id;
  }

}
