import { Injectable } from '@angular/core';
import { InboxRepository } from '../repositories/inbox.repository';
import { InboxEntry, InboxEntryStatus } from '../models/inbox-entry.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InboxStoreService {

  constructor(private inboxRepository: InboxRepository) { }

  public getEntries(): Observable<InboxEntry[]> {
    return this.inboxRepository.getEntries();
  }

  public addEntry(text: string): Observable<InboxEntry> {
    return this.inboxRepository.addEntry(text);
  }

  public udpateEntry(updateEntry: InboxEntry): Observable<InboxEntry> {
    return this.inboxRepository.updateEntry(updateEntry);
  }

  public updateStatus(entryId: string, status: InboxEntryStatus): Observable<InboxEntry | undefined> {
    return this.inboxRepository.updateStatus(entryId, status);
  }

  public deleteEntry(entryId: string): Observable<void> {
    return this.inboxRepository.deleteEntry(entryId);
  }

  public markAsConverted(inboxEntryId: string, goalId: string): Observable<InboxEntry | undefined> {
    return this.inboxRepository.markAsConverted(inboxEntryId, goalId);
  }
}
