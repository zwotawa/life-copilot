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
  }

  public onSubmit(goalForm: any): void {
    if(this.goal.id) {
      // Update existing goal logic
      updateGoal(this.goal);
    } else {
      const newGoal: Goal = {
        ...this.goal,
        id: this.goal.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() // Simple ID generation based on title and timestamp
      };
      addGoal(newGoal);
    }
  }

}
