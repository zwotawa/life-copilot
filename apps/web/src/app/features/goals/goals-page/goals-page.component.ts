import { Component, OnInit } from '@angular/core';
import { SEED_GOALS } from 'src/app/core/data/seed-goals';
import { Goal } from 'src/app/core/models/goal.model';
import { getGoals, saveGoals } from 'src/app/core/services/goal-store.service';

@Component({
  selector: 'app-goals-page',
  templateUrl: './goals-page.component.html',
  styleUrls: ['./goals-page.component.scss']
})
export class GoalsPageComponent implements OnInit {

  public goals: Goal[] = [];

  constructor() { }

  ngOnInit(): void {
    saveGoals(SEED_GOALS);
    this.goals = getGoals();
  }

}
