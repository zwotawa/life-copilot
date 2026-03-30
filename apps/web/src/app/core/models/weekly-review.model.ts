export interface WeeklyReviewState {
  id: string;
  weekStartDate: string;
  anchorGoalIds: string[];
  infrastructureGoalId: string | null;
  maintenanceGoalIds: string[];
  creativeGoalId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}