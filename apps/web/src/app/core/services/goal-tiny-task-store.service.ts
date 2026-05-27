import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, retry, shareReplay, tap } from 'rxjs/operators';

import { GoalTinyTaskRepository } from '../repositories/goal-tiny-task.repository';
import { GoalTinyTask } from '../models/goal-tiny-task.model';

@Injectable({
  providedIn: 'root'
})
export class GoalTinyTaskStoreService {
  private readonly tasksByMilestoneId = new Map<string, GoalTinyTask[]>();
  private readonly inFlightLoadsByMilestoneId = new Map<string, Observable<GoalTinyTask[]>>();

  constructor(
    private readonly goalTinyTaskRepository: GoalTinyTaskRepository
  ) {}

  public getTasksForMilestone(milestoneId: string): Observable<GoalTinyTask[]> {
    const inFlightLoad = this.inFlightLoadsByMilestoneId.get(milestoneId);

    if (inFlightLoad) {
      return inFlightLoad;
    }

    const load$ = this.goalTinyTaskRepository.getTasksForMilestone(milestoneId).pipe(
      retry({
        count: 2,
        delay: (_error, retryCount) => timer(retryCount * 250)
      }),
      tap(tasks => {
        this.tasksByMilestoneId.set(milestoneId, this.cloneTasks(tasks));
      }),
      catchError(error => {
        const cachedTasks = this.tasksByMilestoneId.get(milestoneId);

        if (cachedTasks) {
          return of(this.cloneTasks(cachedTasks));
        }

        return throwError(() => error);
      }),
      finalize(() => {
        this.inFlightLoadsByMilestoneId.delete(milestoneId);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.inFlightLoadsByMilestoneId.set(milestoneId, load$);

    return load$;
  }

  public addTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.goalTinyTaskRepository.addTask(task).pipe(
      tap(savedTask => {
        const cachedTasks = this.tasksByMilestoneId.get(savedTask.milestoneId);

        if (!cachedTasks) {
          return;
        }

        this.tasksByMilestoneId.set(
          savedTask.milestoneId,
          this.cloneTasks([...cachedTasks, savedTask])
        );
      })
    );
  }

  public updateTask(task: GoalTinyTask): Observable<GoalTinyTask> {
    return this.goalTinyTaskRepository.updateTask(task).pipe(
      tap(savedTask => {
        this.removeTaskFromCachedMilestones(savedTask.id);

        const cachedTasks = this.tasksByMilestoneId.get(savedTask.milestoneId);

        if (!cachedTasks) {
          return;
        }

        this.tasksByMilestoneId.set(
          savedTask.milestoneId,
          this.cloneTasks([...cachedTasks, savedTask])
        );
      })
    );
  }

  public deleteTask(id: string): Observable<void> {
    return this.goalTinyTaskRepository.deleteTask(id).pipe(
      tap(() => {
        this.removeTaskFromCachedMilestones(id);
      })
    );
  }

  private removeTaskFromCachedMilestones(taskId: string): void {
    this.tasksByMilestoneId.forEach((tasks, milestoneId) => {
      if (!tasks.some(task => task.id === taskId)) {
        return;
      }

      this.tasksByMilestoneId.set(
        milestoneId,
        this.cloneTasks(tasks.filter(task => task.id !== taskId))
      );
    });
  }

  private cloneTasks(tasks: GoalTinyTask[]): GoalTinyTask[] {
    return tasks.map(task => ({ ...task }));
  }
}
