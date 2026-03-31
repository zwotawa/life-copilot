const KEY = 'lifeCopilot.inbox';

export function loadInbox(): any[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as any[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveInbox(items: any[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function removeInboxItemById(idToRemove: string): void {
    const items: any[] = loadInbox();
    const updatedInboxItems: any[] = items.filter(item => item.id !== idToRemove);
    saveInbox(updatedInboxItems);
}