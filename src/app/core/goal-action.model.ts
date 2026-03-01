export interface GoalAction {
    id: string;
    text?: string;
    createdAt?: string;
    sourceInboxId?: string;
    completedAt?: string;
    durationSeconds?: number;
    goalKey?: string;
}