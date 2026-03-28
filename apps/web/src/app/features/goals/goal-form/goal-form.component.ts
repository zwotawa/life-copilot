import { Component, OnInit } from '@angular/core';
import { Goal } from 'src/app/core/models/goal.model';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss']
})
export class GoalFormComponent implements OnInit {

  public goal: Goal = <Goal>{}

  constructor() { }

  ngOnInit(): void {
  }

  public onSubmit(goalForm: any): void {

  }

}
