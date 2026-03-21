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

export type UpdateJobCardRequest = {
    company: string;
    role: string;
    stage: string;
    link: string | null;
    nextAction: string | null;
    nextTouchAt: number | null;
}

export type CreateJobCardRequest = {
    company: string;
    role: string;
    stage: string;
    link: string | null;
    nextAction: string | null;
    nextTouchAt: number | null;
}
