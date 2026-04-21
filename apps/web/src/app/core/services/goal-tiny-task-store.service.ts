import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GoalTinyTaskRepository } from '../repositories/goal-tiny-task.repository';
import { GoalTinyTask } from '../models/goal-tiny-task.model';

@Injectable({
  providedIn: 'root'
})
export class GoalTinyTaskStoreService {
  constructor(
    private readonly goalTinyTaskRepository: GoalTinyTaskRepository
  ) {}

  public getTasksForMilestone(milestoneId: string): Observable<GoalTinyTask[]> {
    return this.goalTinyTaskRepository.getTasksForMilestone(milestoneId);
  }

  public addTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.goalTinyTaskRepository.addTask(task);
  }

  public updateTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.goalTinyTaskRepository.updateTask(task);
  }

  public deleteTask(id: string): Observable<void> {
    return this.goalTinyTaskRepository.deleteTask(id);
  }
}