import { Injectable } from '@angular/core';
import { WeeklyReviewRepository } from '../repositories/weekly-review.repository';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewStoreService {

  constructor(private weeklyReviewRepository: WeeklyReviewRepository) { }

  public getCurrentWeeklyReview(): Observable<WeeklyReviewState> {
    return this.weeklyReviewRepository.getCurrentWeeklyReview();
  }

  public saveWeeklyReview(review: WeeklyReviewState): Observable<WeeklyReviewState> {
    return this.weeklyReviewRepository.saveWeeklyReview(review);
  }

  public resetWeeklyReview(): Observable<WeeklyReviewState> {
    return this.weeklyReviewRepository.resetWeeklyReview();
  }
}
