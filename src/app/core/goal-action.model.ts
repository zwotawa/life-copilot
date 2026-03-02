export type GoalKey = 'job' | 'vehicle' | 'declutter';

export interface GoalAction {
    id: string;
    text: string;
    goalKey: GoalKey;
    createdAt: string;
    sourceInboxId?: string;
    completedAt?: string;
    durationSeconds?: number;
}