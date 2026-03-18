export type JobStage = 'toApply' | 'applied' | 'followUp' | 'interview';

export interface JobCard {
    id: string;
    company: string;
    role: string;
    link?: string;
    stage: JobStage;
    createdAt: number;
    lastTouchedAt: number;
    nextAction?: string;
    nextTouchAt?: number;
}