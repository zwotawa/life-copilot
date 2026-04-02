import { InboxEntry, InboxEntryStatus } from "../models/inbox-entry.model";


export abstract class InboxRepository {
  abstract getEntries(): InboxEntry[];
  abstract addEntry(text: string): void;
  abstract updateEntry(updateEntry: InboxEntry): void;
  abstract updateStatus(entryId: string, status: InboxEntryStatus): void;
  abstract deleteEntry(entryId: string): void;
  abstract markAsConverted(inboxEntryId: string, goalId: string): void;
}