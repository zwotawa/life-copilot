import { WeeklyReviewState } from "../models/weekly-review.model";

export abstract class WeeklyReviewRepository {
 abstract getCurrentWeeklyReview(): WeeklyReviewState;
 abstract saveWeeklyReview(review: WeeklyReviewState): void;
 abstract resetWeeklyReview(): WeeklyReviewState;
}