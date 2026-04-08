import { Injectable } from "@angular/core";
import { Goal } from "../models/goal.model";
import { GoalRepository } from "../repositories/goal.repository";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class GoalStoreService {
  constructor(private readonly goalRepository: GoalRepository) {}

  public getGoals(): Observable<Goal[]> {
    return this.goalRepository.getGoals();
  }

  public getGoalById(id: string): Observable<Goal | undefined> {
    return this.goalRepository.getGoalById(id);
  }

  public addGoal(goal: Goal): Observable<Goal> {
    return this.goalRepository.addGoal(goal);
  }

  public updateGoal(goal: Goal): Observable<Goal> {
    return this.goalRepository.updateGoal(goal);
  }

  public archiveGoalById(id: string): Observable<Goal> {
    return this.goalRepository.archiveGoalById(id);
  }

  public markGoalTouched(id: string): Observable<Goal> {
    return this.goalRepository.markGoalTouched(id);
  }

  public deleteGoal(id: string): Observable<void> {
    return this.goalRepository.deleteGoal(id);
  }
}