import { Injectable } from '@angular/core';
import { InboxRepository } from '../repositories/inbox.repository';
import { InboxEntry, InboxEntryStatus } from '../models/inbox-entry.model';

@Injectable({
  providedIn: 'root'
})
export class InboxStoreService {

  constructor(private inboxRepository: InboxRepository) { }

  public getEntries(): InboxEntry[] {
    return this.inboxRepository.getEntries();
  }

  public addEntry(text: string): void {
    return this.inboxRepository.addEntry(text);
  }

  public udpateEntry(updateEntry: InboxEntry): void {
    return this.inboxRepository.updateEntry(updateEntry);
  }

  public updateStatus(entryId: string, status: InboxEntryStatus): void {
    return this.inboxRepository.updateStatus(entryId, status);
  }

  public deleteEntry(entryId: string): void {
    return this.inboxRepository.deleteEntry(entryId);
  }

  public markAsConverted(inboxEntryId: string, goalId: string): void {
    return this.inboxRepository.markAsConverted(inboxEntryId, goalId);
  }
}
