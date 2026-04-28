export type RoadmapGoalStatus =
  | 'no_active_milestone'
  | 'no_tasks'
  | 'all_tasks_complete'
  | 'has_remaining_tasks';

export interface GoalRoadmapStatus {
  hasActiveMilestone: boolean;
  activeMilestoneTitle: string | null;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
  completedTinyTaskCount: number;
  totalTinyTaskCount: number;
  needsPlanning: boolean;
  planningState: RoadmapGoalStatus;

  hasAnyMilestones: boolean;
  missingRoadmap: boolean;
  missingNextAction: boolean;
}