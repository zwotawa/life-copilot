import { Observable } from 'rxjs';
import { GoalTinyTask } from '../models/goal-tiny-task.model';

export abstract class GoalTinyTaskRepository {
  public abstract getTasksForMilestone(milestoneId: string): Observable<GoalTinyTask[]>;
  public abstract addTask(task: GoalTinyTask): Observable<GoalTinyTask>;
  public abstract updateTask(task: GoalTinyTask): Observable<GoalTinyTask>;
  public abstract deleteTask(id: string): Observable<void>;
}