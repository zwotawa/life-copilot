import { InboxItem } from "./inbox.model";


const KEY = 'lifeCopilot.inbox';

export function loadInbox(): InboxItem[] {
    try {
        const raw = localStorage.getItem(KEY);
        if(!raw) return [];
        const parsed = JSON.parse(raw) as InboxItem[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function saveInbox(items: InboxItem[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
}