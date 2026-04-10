import { ApiInboxEntry } from "../models/api/api-inbox-entry.model";
import { InboxEntry } from "../models/inbox-entry.model";

export function fromApiInboxEntry(api: ApiInboxEntry): InboxEntry {
    return {
        id: api.id,
        text: api.text,
        status: api.status as InboxEntry['status'],
        notes: api.notes ?? undefined,
        linkedGoalId: api.linkedGoalId ?? null,
        capturedAt: api.capturedAt,
        updatedAt: api.updatedAt,
        completedAt: api.completedAt ?? undefined
    }
}