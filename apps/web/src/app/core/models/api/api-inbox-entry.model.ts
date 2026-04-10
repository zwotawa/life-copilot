export interface ApiInboxEntry {
    id: string,
    text: string,
    status: string,
    notes?: string,
    linkedGoalId?: string,
    capturedAt: string,
    updatedAt: string,
    completedAt?: string
}