import { Goal } from "../models/goal.model";
import { Injectable } from "@angular/core";
import { StorageKeyService } from "./storage-key.service";
import { LocalStorageService } from "./local-storage.service";

const MAX_ITEMS = 200;

@Injectable({
    providedIn: 'root'
})
export class GoalStoreService {

    constructor(
        private readonly storageKeyService: StorageKeyService,
        private localStorageService: LocalStorageService
    ) {}

    private get storageKey(): string {
        return this.storageKeyService.forCurrentUser('goals');
    }

    private migrateLegacyIfNeeded(): void {
        const newKey = this.storageKeyService.forCurrentUser('goals');
        const legacyKey = this.storageKeyService.legacy('goals');

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
        if(!raw) return [];
        const parsed = JSON.parse(raw) as Goal[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch (error) {
        console.error('Error parsing goals from localStorage:', error);
        return [];
    }
}

public getGoalById(id: string): Goal | undefined {
    const goals = this.getGoals();
    return goals.find(goal => goal.id === id);
}

private saveGoals(goals: Goal[]): void {
    this.localStorageService.setItem(this.storageKey, JSON.stringify(goals));
}

public addGoal(goal: Goal): void {
    const storedGoals: Goal[] = this.getGoals();
    const udpatedGoals: Goal[] = [goal, ...storedGoals];
    this.saveGoals(udpatedGoals);
}

public updateGoal(newGoal: Goal): void {
    const storedGoals: Goal[] = this.getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => goal.id == newGoal.id ? newGoal : goal);
    this.saveGoals(updatedGoals);
}

public archiveGoalById(idToArchive: string): void {
    const storedGoals: Goal[] = this.getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => {
        if(goal.id === idToArchive) {
            return { ...goal, status: 'archived' };
        }
        return goal;
    });
    this.saveGoals(updatedGoals);
}

public markGoalTouched(idToMark: string): void {
    const now: string = new Date().toISOString();
    const storedGoals: Goal[] = this.getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => {
        if(goal.id === idToMark) {
            return { ...goal, lastTouchedAt: now, lastupdatedAt: now };
        }
        return goal;
    });
    this.saveGoals(updatedGoals); 
}

}