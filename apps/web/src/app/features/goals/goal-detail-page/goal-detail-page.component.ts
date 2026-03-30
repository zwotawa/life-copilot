import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Goal } from 'src/app/core/models/goal.model';
import { GoalStoreService } from 'src/app/core/services/goal-store.service';

@Component({
  selector: 'app-goal-detail-page',
  templateUrl: './goal-detail-page.component.html',
  styleUrls: ['./goal-detail-page.component.scss']
})
export class GoalDetailPageComponent implements OnInit {
  private goalId: string = '';
  public goal: Goal = <Goal>{};

  constructor(private route: ActivatedRoute,
    private goalStoreService: GoalStoreService
  ) { }

  ngOnInit(): void {
    this.goalId = this.extractGoalIdFromRoute();
    this.loadGoalDetails(this.goalId);
  }

  private extractGoalIdFromRoute(): string {
    return this.route.snapshot.paramMap.get('id') || '';
  }

  private loadGoalDetails(goalId: string): void {
    this.goal = this.goalStoreService.getGoalById(goalId) || <Goal>{};
  }

}
