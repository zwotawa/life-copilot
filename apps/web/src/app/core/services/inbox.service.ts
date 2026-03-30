import { Injectable } from '@angular/core';
import { InboxEntry, InboxEntryStatus } from '../models/inbox-entry.model';

const STORAGE_KEY = 'lifeCopilot.inbox';

@Injectable({
  providedIn: 'root'
})
export class InboxService {
  public getEntries(): InboxEntry[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as InboxEntry[];
  }

  public saveEntries(entries: InboxEntry[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  public addEntry(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    const entries = this.getEntries();

    const newEntry: InboxEntry = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      status: 'new',
      notes: '',
      linkedGoalId: null,
      capturedAt: now,
      updatedAt: now
    };

    this.saveEntries([newEntry, ...entries]);
  }

  public updateEntry(updatedEntry: InboxEntry): void {
    const entries = this.getEntries().map(entry =>
      entry.id === updatedEntry.id
        ? { ...updatedEntry, updatedAt: new Date().toISOString() }
        : entry
    );

    this.saveEntries(entries);
  }

  public updateStatus(entryId: string, status: InboxEntryStatus): void {
    const entries = this.getEntries().map(entry =>
      entry.id === entryId
        ? { ...entry, status, updatedAt: new Date().toISOString() }
        : entry
    );

    this.saveEntries(entries);
  }

  public deleteEntry(entryId: string): void {
    const entries = this.getEntries().filter(entry => entry.id !== entryId);
    this.saveEntries(entries);
  }
}