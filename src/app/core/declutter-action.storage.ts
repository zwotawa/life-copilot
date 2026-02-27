import { GoalAction } from "./goal-action.model";


const KEY = 'lifeCopilot.actions.declutter';

export function loadDeclutterActions(): GoalAction[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as GoalAction[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveDeclutterActions(items: GoalAction[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function removeInboxItemById(idToRemove: string): void {
    const items: GoalAction[] = loadDeclutterActions();
    const updatedInboxItems: GoalAction[] = items.filter(item => item.id !== idToRemove);
    saveDeclutterActions(updatedInboxItems);
}