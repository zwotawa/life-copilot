import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalStoreService } from './goal-store.service';
import { InboxStoreService } from './inbox-store.service';

@Injectable({
  providedIn: 'root'
})
export class GoalCreationWorkflowService {
  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly inboxStoreService: InboxStoreService
  ) {}

  public createGoal(goalDraft: Goal, sourceInboxItemId?: string): Goal {
    const now = new Date().toISOString();

    const newGoal: Goal = {
      ...goalDraft,
      id: goalDraft.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      createdAt: now,
      updatedAt: now
    };

    this.goalStoreService.addGoal(newGoal);

    if (sourceInboxItemId) {
      this.inboxStoreService.markAsConverted(sourceInboxItemId, newGoal.id);
    }

    return newGoal;
  }

  public updateGoal(goal: Goal): void {
    const now = new Date().toISOString();

    this.goalStoreService.updateGoal({
      ...goal,
      updatedAt: now
    });
  }
}