import { Observable } from 'rxjs';
import { Goal } from '../models/goal.model';

export abstract class GoalRepository {

  public abstract getGoals(): Observable<Goal[]>;
  public abstract getGoalById(id: string): Observable<Goal | undefined>;
  public abstract addGoal(goal: Goal): Observable<Goal>;
  public abstract updateGoal(goal: Goal): Observable<Goal>;
  public abstract archiveGoalById(id: string): Observable<Goal>;
  public abstract markGoalTouched(id: string): Observable<Goal>;
  public abstract deleteGoal(id: string): Observable<void>;
}
