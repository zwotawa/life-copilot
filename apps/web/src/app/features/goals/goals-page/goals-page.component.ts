import { Component, OnInit } from '@angular/core';
import { SEED_GOALS } from 'src/app/core/data/seed-goals';
import { Goal } from 'src/app/core/models/goal.model';
import { GoalStoreService } from 'src/app/core/repositories/goal-store.service';

@Component({
  selector: 'app-goals-page',
  templateUrl: './goals-page.component.html',
  styleUrls: ['./goals-page.component.scss']
})
export class GoalsPageComponent implements OnInit {

  public goals: Goal[] = [];
  public statusFilter: string = '';
  public laneFilter: string = '';
  public typeFilter: string = '';

  constructor(private goalStoreService: GoalStoreService) { }

  ngOnInit(): void {
    //this.goalStoreService.saveGoals(SEED_GOALS);
    this.goals = this.goalStoreService.getGoals();
  }

  get filteredGoals(): Goal[] {
    return this.goals.filter(goal => {
      return (
        (this.statusFilter ? goal.status === this.statusFilter : true) &&
        (this.laneFilter ? goal.lane === this.laneFilter : true) &&
        (this.typeFilter ? goal.type === this.typeFilter : true)
      );
    });
  }

  public trackByGoalId(index: number, goal: Goal): string {
  return goal.id;
}
}
