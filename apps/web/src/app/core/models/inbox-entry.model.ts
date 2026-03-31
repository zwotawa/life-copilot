export type InboxEntryStatus =
  | 'new'
  | 'clarified'
  | 'deferred'
  | 'archived';

export interface InboxEntry {
  id: string;
  text: string;
  status: InboxEntryStatus;
  notes?: string;
  linkedGoalId?: string | null;
  capturedAt: string;
  updatedAt: string;
  completedAt?: string;
}