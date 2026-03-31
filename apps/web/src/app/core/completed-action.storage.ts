

const KEY = 'lifeCopilot.actions.completed';
const MAX_ITEMS = 200;

export function loadCompletedActions(): any[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as any[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch {
        return [];
    }
}

export function saveCompletedActions(items: any[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function removeCompletedActionById(idToRemove: string): void {
    const items: any[] = loadCompletedActions();
    const updatedCompletedItems: any[] = items.filter(item => item.id !== idToRemove);
    saveCompletedActions(updatedCompletedItems);
}