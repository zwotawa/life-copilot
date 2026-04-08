import { Goal, GoalStatus } from "../../models/goal.model";
import { Injectable } from "@angular/core";
import { StorageKeyService } from "./storage-key.service";
import { LocalStorageService } from "./local-storage.service";
import { GoalRepository } from "../../repositories/goal.repository";
import { Observable, of } from "rxjs";

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

  public getGoals(): Observable<Goal[]> {
    this.migrateLegacyIfNeeded();

    try {
      const raw = this.localStorageService.getItem(this.storageKey);
      if (!raw) return of([]);

      const parsed = JSON.parse(raw) as Goal[];
      return of(Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []);
    } catch (error) {
      console.error("Error parsing goals from localStorage:", error);
      return of([]);
    }
  }

  public getGoalById(id: string): Observable<Goal | undefined> {
    const goals = this.readGoals();
    return of(goals.find(goal => goal.id === id));
  }

  private readGoals(): Goal[] {
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

  private saveGoals(goals: Goal[]): void {
    this.localStorageService.setItem(
      this.storageKey,
      JSON.stringify(goals.slice(0, MAX_ITEMS))
    );
  }

  public addGoal(goal: Goal): Observable<Goal> {
    const storedGoals = this.readGoals();
    const updatedGoals = [goal, ...storedGoals];
    this.saveGoals(updatedGoals);
    return of(goal);
  }

  public updateGoal(newGoal: Goal): Observable<Goal> {
    const storedGoals = this.readGoals();
    const updatedGoals = storedGoals.map(goal =>
      goal.id === newGoal.id ? newGoal : goal
    );
    this.saveGoals(updatedGoals);
    return of(newGoal);
  }

  public archiveGoalById(idToArchive: string): Observable<Goal> {
    const archived: GoalStatus = 'archived';
    const storedGoals = this.readGoals();
    let updatedGoal: Goal = <Goal>{};
    const updatedGoals = storedGoals.map(goal =>
      goal.id === idToArchive
        ? updatedGoal = { ...goal, status: archived }
        : goal
    );
    this.saveGoals(updatedGoals);
    return of(updatedGoal);
  }

  public markGoalTouched(idToMark: string): Observable<Goal> {
    const now = new Date().toISOString();
    const storedGoals = this.readGoals();
    let updatedGoal: Goal = <Goal>{};

    const updatedGoals = storedGoals.map(goal =>
      goal.id === idToMark
        ? updatedGoal = {
            ...goal,
            lastTouchedAt: now,
            updatedAt: now
          }
        : goal
    );

    this.saveGoals(updatedGoals);
    return of(updatedGoal);
  }

  public deleteGoal(id: string): Observable<void> {
    const storedGoals = this.readGoals();
    const updatedGoals = storedGoals.filter(goal => goal.id !== id);
    this.saveGoals(updatedGoals);
    return of(void 0);
  }
}