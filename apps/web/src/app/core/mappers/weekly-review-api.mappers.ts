import { ApiWeeklyReview } from "../models/api/api-weekly-review.model";
import { WeeklyReviewState } from "../models/weekly-review.model";

export function fromApiWeeklyReview(api: ApiWeeklyReview): WeeklyReviewState {
    return {
        id: api.id,
        weekStartDate: api.weekStartDate,
        anchorGoalIds: api.anchorGoalIds,
        infrastructureGoalId: api.infrastuctureGoalId,
        maintenanceGoalIds: api.maintenanceGoalids,
        creativeGoalId: api.creativeGoalId,
        notes: api.notes,
        createdAt: api.createdAt,
        updatedAt: api.updatedAt
    }
}