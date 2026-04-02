import { Goal } from '../models/goal.model';

export abstract class GoalRepository {

  public abstract getGoals(): Goal[];
  public abstract getGoalById(id: string): Goal | undefined;
  public abstract addGoal(goal: Goal): void;
  public abstract updateGoal(goal: Goal): void;
  public abstract archiveGoalById(id: string): void;
  public abstract markGoalTouched(id: string): void;
  public abstract deleteGoal(id: string): void;
}
