import { Observable } from "rxjs";
import { InboxEntry, InboxEntryStatus } from "../models/inbox-entry.model";


export abstract class InboxRepository {
  abstract getEntries(): Observable<InboxEntry[]>;
  abstract addEntry(text: string): Observable<InboxEntry>;
  abstract updateEntry(updateEntry: InboxEntry): Observable<InboxEntry>;
  abstract updateStatus(entryId: string, status: InboxEntryStatus): Observable<InboxEntry | undefined>;
  abstract deleteEntry(entryId: string): Observable<void>;
  abstract markAsConverted(inboxEntryId: string, goalId: string): Observable<InboxEntry | undefined>;
}