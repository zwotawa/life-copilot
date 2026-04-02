import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Goal } from 'src/app/core/models/goal.model';
import { GoalStoreService } from 'src/app/core/repositories/goal-store.service';
import { InboxStoreService } from 'src/app/core/services/inbox-store.service';

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
    private goalStoreService: GoalStoreService,
    private router: Router,
    private inboxService: InboxStoreService
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
    const now = new Date().toISOString();

    if (this.goal.id) {
      this.goalStoreService.updateGoal({
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
    this.goalStoreService.addGoal(newGoal);

    if (newGoal && this.navState?.inboxItemId) {
      console.log('Marking inbox entry as converted:', this.navState.inboxItemId, 'to goal:', newGoal.id);
      this.inboxService.markAsConverted(this.navState.inboxItemId, newGoal.id);
    }
  }

  get isNewGoal(): boolean {
    return !this.goal.id;
  }

}
