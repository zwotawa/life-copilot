import { Injectable } from '@angular/core';
import { InboxEntry, InboxEntryStatus } from '../../models/inbox-entry.model';
import { StorageKeyService } from './storage-key.service';
import { LocalStorageService } from './local-storage.service';
import { InboxRepository } from '../../repositories/inbox.repository';
import { Observable, of } from 'rxjs';

@Injectable()
export class LocalInboxService extends InboxRepository{

  constructor(
    private readonly storageKeyService: StorageKeyService,
    private localStorageService: LocalStorageService
  ) {
    super();
  }

  private get storageKey(): string {
    return this.storageKeyService.forCurrentUser('inbox');
  }

  private migrateLegacyIfNeeded(): void {
  const newKey = this.storageKeyService.forCurrentUser('inbox');
  const legacyKey = this.storageKeyService.legacy('inbox');

  const hasNewValue = this.localStorageService.getItem(newKey);
  if (hasNewValue) {
    return;
  }

  const legacyValue = this.localStorageService.getItem(legacyKey);
  if (!legacyValue) {
    return;
  }

  this.localStorageService.setItem(newKey, legacyValue);
}

  public getEntries(): Observable<InboxEntry[]> {
    this.migrateLegacyIfNeeded();

    const stored = this.localStorageService.getItem(this.storageKey);
    if (!stored) return of([]);
    return of(JSON.parse(stored) as InboxEntry[]);
  }

  public saveEntries(entries: InboxEntry[]): void {
    this.localStorageService.setItem(this.storageKey, JSON.stringify(entries));
  }

 public addEntry(text: string): Observable<InboxEntry> {
    const trimmed = text.trim();
    const now = new Date().toISOString();

    const newEntry: InboxEntry = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      status: 'new',
      notes: '',
      linkedGoalId: null,
      capturedAt: now,
      updatedAt: now
    };

    if (!trimmed) {
      return of(newEntry);
    }

    const entries = this.readEntries();
    this.saveEntries([newEntry, ...entries]);

    return of(newEntry);
  }

  public updateEntry(updatedEntry: InboxEntry): Observable<InboxEntry> {
    const savedEntry: InboxEntry = {
      ...updatedEntry,
      updatedAt: new Date().toISOString()
    };

    const entries = this.readEntries().map(entry =>
      entry.id === updatedEntry.id ? savedEntry : entry
    );

    this.saveEntries(entries);
    return of(savedEntry);
  }

  public updateStatus(entryId: string, status: InboxEntryStatus): Observable<InboxEntry | undefined> {
    const now = new Date().toISOString();
    let updated: InboxEntry | undefined;

    const entries = this.readEntries().map(entry => {
      if (entry.id !== entryId) {
        return entry;
      }

      updated = { ...entry, status, updatedAt: now };
      return updated;
    });

    this.saveEntries(entries);
    return of(updated);
  }

  public deleteEntry(entryId: string): Observable<void> {
    const entries = this.readEntries().filter(entry => entry.id !== entryId);
    this.saveEntries(entries);
    return of(void 0);
  }

   public markAsConverted(inboxEntryId: string, goalId: string): Observable<InboxEntry | undefined> {
    const archived: InboxEntryStatus = 'archived';
    const now = new Date().toISOString();
    let updated: InboxEntry | undefined;

    const entries = this.readEntries().map(entry => {
      if (entry.id !== inboxEntryId) {
        return entry;
      }

      updated = {
        ...entry,
        linkedGoalId: goalId,
        updatedAt: now,
        status: archived
      };

      return updated;
    });

    this.saveEntries(entries);
    return of(updated);
  }

  private readEntries(): InboxEntry[] {
    this.migrateLegacyIfNeeded();

    const stored = this.localStorageService.getItem(this.storageKey);
    if (!stored) return [];
    return JSON.parse(stored) as InboxEntry[];
  }
}