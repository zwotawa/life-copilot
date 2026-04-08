export type GoalProgressEventType =
  | 'daily_task_completed'
  | 'daily_task_uncompleted'
  | 'milestone_completed'
  | 'note'
  | 'status_changed';

export interface GoalProgressEvent {
  id: string;
  goalId: string;
  date: string;          // yyyy-mm-dd for easy daily grouping
  createdAt: string;     // full ISO timestamp

  type: GoalProgressEventType;

  taskText?: string;
  notes?: string;

  source?: 'daily_rotation' | 'weekly_review' | 'goal_detail' | 'system';
  sourceItemId?: string; // e.g. daily rotation item id
}