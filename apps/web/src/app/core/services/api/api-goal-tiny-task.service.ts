import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { GoalTinyTaskRepository } from '../../repositories/goal-tiny-task.repository';
import { GoalTinyTask } from '../../models/goal-tiny-task.model';

@Injectable({
  providedIn: 'root'
})
export class ApiGoalTinyTaskService extends GoalTinyTaskRepository {
  private readonly apiBaseUrl = '/api/goal-tiny-tasks';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getTasksForMilestone(milestoneId: string): Observable<GoalTinyTask[]> {
    return this.http.get<GoalTinyTask[]>(`${this.apiBaseUrl}/milestone/${milestoneId}`);
  }

  public addTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.http.post<GoalTinyTask>(this.apiBaseUrl, task);
  }

  public updateTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.http.put<GoalTinyTask>(`${this.apiBaseUrl}/${task.id}`, task);
  }

  public deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }
}