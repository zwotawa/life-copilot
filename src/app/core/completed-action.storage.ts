import { GoalAction } from "./goal-action.model";


const KEY = 'lifeCopilot.actions.completed';

export function loadCompletedActions(): GoalAction[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as GoalAction[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveCompletedActions(items: GoalAction[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function removeCompletedActionById(idToRemove: string): void {
    const items: GoalAction[] = loadCompletedActions();
    const updatedInboxItems: GoalAction[] = items.filter(item => item.id !== idToRemove);
    saveCompletedActions(updatedInboxItems);
}