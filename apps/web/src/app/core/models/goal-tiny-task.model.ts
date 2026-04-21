export type GoalTinyTaskStatus = 'not_started' | 'completed';

export interface GoalTinyTask {
  id: string;
  goalId: string;
  milestoneId: string;
  title: string;
  order: number;
  status: GoalTinyTaskStatus;
  createdAt: string;
  completedAt?: string | null;
}