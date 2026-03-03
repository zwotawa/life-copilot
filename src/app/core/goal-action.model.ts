export type GoalKey = 'job' | 'vehicle' | 'declutter';

export interface GoalAction {
    id: string;
    text: string;
    goalKey: GoalKey;
    createdAt: number;
    sourceInboxId?: string;
    completedAt?: number;
    durationSeconds?: number;
}