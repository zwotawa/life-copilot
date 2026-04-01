import { Goal } from "../models/goal.model";
import { Injectable } from "@angular/core";

const KEY = 'lifeCopilot.goals';
const MAX_ITEMS = 200;

@Injectable({
    providedIn: 'root'
})
export class GoalStoreService {

public getGoals(): Goal[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as Goal[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch {
        return [];
    }
}

public getGoalById(id: string): Goal | undefined {
    const goals = this.getGoals();
    return goals.find(goal => goal.id === id);
}

private saveGoals(goals: Goal[]): void {
    localStorage.setItem(KEY, JSON.stringify(goals));
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
    const storedGoals: Goal[] = this.getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => {
        if(goal.id === idToMark) {
            return { ...goal, lastTouchedAt: new Date().toISOString() };
        }
        return goal;
    });
    this.saveGoals(updatedGoals); 
}

}