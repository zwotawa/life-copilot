export interface ApiWeeklyReview {
    id: string;
    weekStartDate: string;
    anchorGoalIds: string[];
    infrastuctureGoalId: string;
    maintenanceGoalids: string[];
    creativeGoalId: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}