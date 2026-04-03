import { Goal, GoalStatus } from "../../models/goal.model";
import { Injectable } from "@angular/core";
import { StorageKeyService } from "./storage-key.service";
import { LocalStorageService } from "./local-storage.service";
import { GoalRepository } from "../../repositories/goal.repository";

const MAX_ITEMS = 200;

@Injectable()
export class LocalGoalRepository extends GoalRepository {
  constructor(
    private readonly storageKeyService: StorageKeyService,
    private readonly localStorageService: LocalStorageService
  ) {
    super();
  }

  private get storageKey(): string {
    return this.storageKeyService.forCurrentUser("goals");
  }

  private migrateLegacyIfNeeded(): void {
    const newKey = this.storageKeyService.forCurrentUser("goals");
    const legacyKey = this.storageKeyService.legacy("goals");

    const hasNewValue = this.localStorageService.getItem(newKey);
    if (hasNewValue) {
      return;
    }

    const legacyValue = this.localStorageService.getItem(legacyKey);
    if (!legacyValue) {
      return;
    }

    this.localStorageService.setItem(newKey, legacyValue);
  }

  public getGoals(): Goal[] {
    this.migrateLegacyIfNeeded();

    try {
      const raw = this.localStorageService.getItem(this.storageKey);
      if (!raw) return [];

      const parsed = JSON.parse(raw) as Goal[];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch (error) {
      console.error("Error parsing goals from localStorage:", error);
      return [];
    }
  }

  public getGoalById(id: string): Goal | undefined {
    return this.getGoals().find(goal => goal.id === id);
  }

  private saveGoals(goals: Goal[]): void {
    this.localStorageService.setItem(
      this.storageKey,
      JSON.stringify(goals.slice(0, MAX_ITEMS))
    );
  }

  public addGoal(goal: Goal): void {
    const storedGoals = this.getGoals();
    const updatedGoals = [goal, ...storedGoals];
    this.saveGoals(updatedGoals);
  }

  public updateGoal(newGoal: Goal): void {
    const storedGoals = this.getGoals();
    const updatedGoals = storedGoals.map(goal =>
      goal.id === newGoal.id ? newGoal : goal
    );
    this.saveGoals(updatedGoals);
  }

  public archiveGoalById(idToArchive: string): void {
    const archived: GoalStatus = 'archived';
    const storedGoals = this.getGoals();
    const updatedGoals = storedGoals.map(goal =>
      goal.id === idToArchive
        ? { ...goal, status: archived }
        : goal
    );
    this.saveGoals(updatedGoals);
  }

  public markGoalTouched(idToMark: string): void {
    const now = new Date().toISOString();
    const storedGoals = this.getGoals();

    const updatedGoals = storedGoals.map(goal =>
      goal.id === idToMark
        ? {
            ...goal,
            lastTouchedAt: now,
            lastUpdatedAt: now
          }
        : goal
    );

    this.saveGoals(updatedGoals);
  }

  public deleteGoal(id: string): void {
    const storedGoals = this.getGoals();
    const updatedGoals = storedGoals.filter(goal => goal.id !== id);
    this.saveGoals(updatedGoals);
  }
}