export type GoalMilestoneStatus = 'not_started' | 'active' | 'completed';

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  notes?: string | null;
  order: number;
  status: GoalMilestoneStatus;
  createdAt: string;
  completedAt?: string | null;
}