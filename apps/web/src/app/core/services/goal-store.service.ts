import { Goal } from "../models/goal.model";

const KEY = 'lifeCopilot.goals';
const MAX_ITEMS = 200;

export function getGoals(): Goal[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as Goal[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch {
        return [];
    }
}

export function getGoalById(id: string): Goal | undefined {
    const goals = getGoals();
    return goals.find(goal => goal.id === id);
}

export function saveGoals(goals: Goal[]): void {
    localStorage.setItem(KEY, JSON.stringify(goals));
}

export function addGoal(goal: Goal): void {
    const storedGoals: Goal[] = getGoals();
    const udpatedGoals: Goal[] = [goal, ...storedGoals];
    saveGoals(udpatedGoals);
}

export function updateGoal(newGoal: Goal): void {
    const storedGoals: Goal[] = getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => goal.id == newGoal.id ? newGoal : goal);
    saveGoals(updatedGoals);
}

export function archiveGoalById(idToArchive: string): void {
    const storedGoals: Goal[] = getGoals();
    const updatedGoals: Goal[] = storedGoals.map(goal => {
        if(goal.id === idToArchive) {
            return { ...goal, status: 'archived' };
        }
        return goal;
    });
    saveGoals(updatedGoals);
}