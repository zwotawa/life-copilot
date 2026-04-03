import { Injectable } from '@angular/core';
import { WeeklyReviewRepository } from '../repositories/weekly-review.repository';
import { WeeklyReviewState } from '../models/weekly-review.model';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewStoreService {

  constructor(private weeklyReviewRepository: WeeklyReviewRepository) { }

  public getCurrentWeeklyReview(): WeeklyReviewState {
    return this.weeklyReviewRepository.getCurrentWeeklyReview();
  }

  public saveWeeklyReview(review: WeeklyReviewState): void {
    this.saveWeeklyReview(review);
  }

  public resetWeeklyReview(): WeeklyReviewState {
    return this.weeklyReviewRepository.resetWeeklyReview();
  }
}
