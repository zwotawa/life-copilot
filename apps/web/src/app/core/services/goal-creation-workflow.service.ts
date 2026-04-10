import { Injectable } from '@angular/core';
import { Goal } from '../models/goal.model';
import { GoalStoreService } from './goal-store.service';
import { InboxStoreService } from './inbox-store.service';
import { map, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoalCreationWorkflowService {
  constructor(
    private readonly goalStoreService: GoalStoreService,
    private readonly inboxStoreService: InboxStoreService
  ) {}

  public createGoal(goalDraft: Goal, sourceInboxItemId?: string): Observable<Goal> {
    const now = new Date().toISOString();

    const newGoal: Goal = {
      ...goalDraft,
      id: '',
      createdAt: now,
      updatedAt: now
    };

    return this.goalStoreService.addGoal(newGoal).pipe(
      switchMap(addedGoal => {
        if (sourceInboxItemId) {
          return this.inboxStoreService.markAsConverted(sourceInboxItemId, addedGoal.id).pipe(
            map(() => addedGoal)
          )
        }
        return of(addedGoal);
      })
    );
  }

  public updateGoal(goal: Goal): Observable<Goal> {
    const now = new Date().toISOString();

    return this.goalStoreService.updateGoal({
      ...goal,
      updatedAt: now
    });
  }
}