import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GoalMilestoneRepository } from '../../repositories/goal-milestone.repository';
import { GoalMilestone } from '../../models/goal-milestone.model';

@Injectable({
  providedIn: 'root'
})
export class ApiGoalMilestoneService extends GoalMilestoneRepository {
  private readonly apiBaseUrl = '/api/goal-milestones';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getMilestonesForGoal(goalId: string): Observable<GoalMilestone[]> {
    return this.http.get<GoalMilestone[]>(`${this.apiBaseUrl}/goal/${goalId}`);
  }

  public addMilestone(milestone: GoalMilestone): Observable<GoalMilestone> {
    return this.http.post<GoalMilestone>(this.apiBaseUrl, milestone);
  }

  public updateMilestone(milestone: GoalMilestone): Observable<GoalMilestone> {
    return this.http.put<GoalMilestone>(`${this.apiBaseUrl}/${milestone.id}`, milestone);
  }

  public deleteMilestone(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  public reorderMilestones(goalId: string, milestones: GoalMilestone[]): Observable<GoalMilestone[]> {
    return this.http.put<GoalMilestone[]>(`${this.apiBaseUrl}/goal/${goalId}/reorder`, milestones);
  }
}