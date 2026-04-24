export interface GoalRoadmapProgressItem {
  goalId: string;
  goalTitle: string;
  activeMilestoneTitle: string | null;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
  completedTinyTaskCount: number;
  totalTinyTaskCount: number;
  needsPlanning: boolean;
  planningState: 'no_tasks' | 'all_tasks_complete' | 'has_remaining_tasks';
}

export interface GoalRoadmapInsights {
  goalsWithActiveMilestonesCount: number;
  completedMilestonesCount: number;
  completedTinyTasksCount: number;
  goalsNeedingPlanningCount: number;
  activeGoalSnapshots: GoalRoadmapProgressItem[];
}