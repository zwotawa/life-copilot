import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GoalMilestoneRepository } from '../repositories/goal-milestone.repository';
import { GoalMilestone } from '../models/goal-milestone.model';

@Injectable({
  providedIn: 'root'
})
export class GoalMilestoneStoreService {
  constructor(
    private readonly goalMilestoneRepository: GoalMilestoneRepository
  ) {}

  public getMilestonesForGoal(goalId: string): Observable<GoalMilestone[]> {
    return this.goalMilestoneRepository.getMilestonesForGoal(goalId);
  }

  public addMilestone(milestone: GoalMilestone): Observable<GoalMilestone> {
    return this.goalMilestoneRepository.addMilestone(milestone);
  }

  public updateMilestone(milestone: GoalMilestone): Observable<GoalMilestone> {
    return this.goalMilestoneRepository.updateMilestone(milestone);
  }

  public deleteMilestone(id: string): Observable<void> {
    return this.goalMilestoneRepository.deleteMilestone(id);
  }

  public reorderMilestones(goalId: string, milestones: GoalMilestone[]): Observable<GoalMilestone[]> {
    return this.goalMilestoneRepository.reorderMilestones(goalId, milestones);
  }
}