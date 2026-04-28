import { RoadmapGoalStatus } from "./goal-roadmap-status.model";

export interface GoalRoadmapProgressItem {
  goalId: string;
  goalTitle: string;
  activeMilestoneTitle: string | null;
  completedMilestoneCount: number;
  totalMilestoneCount: number;
  completedTinyTaskCount: number;
  totalTinyTaskCount: number;
  needsPlanning: boolean;
  planningState: RoadmapGoalStatus;
}

export interface GoalRoadmapInsights {
  goalsWithActiveMilestonesCount: number;
  completedMilestonesCount: number;
  completedTinyTasksCount: number;
  goalsNeedingPlanningCount: number;
  activeGoalSnapshots: GoalRoadmapProgressItem[];
}