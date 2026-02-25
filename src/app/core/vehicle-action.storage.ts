import { GoalAction } from "./goal-action.model";


const KEY = 'lifeCopilot.actions.vehicle';

export function loadVehicleActions(): GoalAction[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as GoalAction[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveVehicleActions(items: GoalAction[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}