import { SelectedAction } from "../shared/goal-card/goal-card.component";



const KEY = 'lifeCopilot.selected-actions';




export function loadSelectedActions(): SelectedAction[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as SelectedAction[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveSelectedActions(items: SelectedAction[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function setSelectedActionId(id: number): void {
    const items: SelectedAction[] = loadSelectedActions();
    
}