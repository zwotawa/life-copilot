import { Injectable } from '@angular/core';
import { InboxEntry, InboxEntryStatus } from '../models/inbox-entry.model';
import { StorageKeyService } from './storage-key.service';
import { LocalStorageService } from './local-storage.service';
import { InboxRepository } from '../repositories/inbox.repository';

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

  public getEntries(): InboxEntry[] {
    this.migrateLegacyIfNeeded();

    const stored = this.localStorageService.getItem(this.storageKey);
    if (!stored) return [];
    return JSON.parse(stored) as InboxEntry[];
  }

  public saveEntries(entries: InboxEntry[]): void {
    this.localStorageService.setItem(this.storageKey, JSON.stringify(entries));
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

  markAsConverted(inboxEntryId: string, goalId: string): void {
    const archived: InboxEntryStatus = 'archived';
    const now = new Date().toISOString();
    const entries = this.getEntries().map(entry =>
      entry.id == inboxEntryId
        ? {
            ...entry,
            linkedGoalId: goalId,
            updatedAt: now,
            status: archived
          }
        : entry
    );

    this.saveEntries(entries);
  }
}