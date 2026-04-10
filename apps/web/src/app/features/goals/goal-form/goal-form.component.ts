import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Goal } from 'src/app/core/models/goal.model';
import { GoalCreationWorkflowService } from 'src/app/core/services/goal-creation-workflow.service';

@Component({
  selector: 'app-goal-form',
  templateUrl: './goal-form.component.html',
  styleUrls: ['./goal-form.component.scss']
})
export class GoalFormComponent implements OnInit {

  @Input() goal: Goal = <Goal>{};

  private nav = this.router.getCurrentNavigation();
  private navState = this.nav?.extras?.state as {
    inboxItemId?: string;
    prefillGoalTitle?: string;
  } | undefined;

  constructor(
    private router: Router,
    private goalCreateWorkflowService: GoalCreationWorkflowService
  ) { }

  ngOnInit(): void {
    if (!this.goal.status) this.goal.status = 'active';
    if (!this.goal.type) this.goal.type = 'project';
    if (!this.goal.dueStyle) this.goal.dueStyle = 'cadence_only';
    if (!this.goal.minimumTouchFrequency) this.goal.minimumTouchFrequency = 'weekly';
    if (this.isNewGoal && this.navState?.prefillGoalTitle) {
      this.goal.title = this.navState.prefillGoalTitle;
    };
  }

  public onSubmit(goalForm: any): void {
    if (this.goal.id) {
      this.goalCreateWorkflowService.updateGoal(this.goal).subscribe({
        next: (savedGoal) => this.router.navigate(['/goals', savedGoal.id])
      });
      return;
    }
    this.goalCreateWorkflowService.createGoal(this.goal, this.navState?.inboxItemId).subscribe({
      next: (savedGoal) => this.router.navigate(['/goals', savedGoal.id])
    });
  }

  get isNewGoal(): boolean {
    return !this.goal.id;
  }

}
