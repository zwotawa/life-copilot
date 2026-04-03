import { Injectable } from "@angular/core";
import { Goal } from "../models/goal.model";
import { GoalRepository } from "../repositories/goal.repository";

@Injectable({
  providedIn: "root"
})
export class GoalStoreService {
  constructor(private readonly goalRepository: GoalRepository) {}

  public getGoals(): Goal[] {
    return this.goalRepository.getGoals();
  }

  public getGoalById(id: string): Goal | undefined {
    return this.goalRepository.getGoalById(id);
  }

  public addGoal(goal: Goal): void {
    this.goalRepository.addGoal(goal);
  }

  public updateGoal(goal: Goal): void {
    this.goalRepository.updateGoal(goal);
  }

  public archiveGoalById(id: string): void {
    this.goalRepository.archiveGoalById(id);
  }

  public markGoalTouched(id: string): void {
    this.goalRepository.markGoalTouched(id);
  }

  public deleteGoal(id: string): void {
    this.goalRepository.deleteGoal(id);
  }
}