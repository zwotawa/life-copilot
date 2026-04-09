import { Observable } from "rxjs";
import { WeeklyReviewState } from "../models/weekly-review.model";

export abstract class WeeklyReviewRepository {
 abstract getCurrentWeeklyReview(): Observable<WeeklyReviewState>;
 abstract saveWeeklyReview(review: WeeklyReviewState): Observable<WeeklyReviewState>;
 abstract resetWeeklyReview(): Observable<WeeklyReviewState>;
}