import { Component, Input, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';
import { updateGoal } from 'src/app/core/services/goal-store.service';

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
    updateGoal(this.goal);
  }

}
