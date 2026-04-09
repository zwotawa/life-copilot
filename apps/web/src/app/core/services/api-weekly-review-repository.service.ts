import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeeklyReviewRepository } from '../repositories/weekly-review.repository';
import { WeeklyReviewState } from '../models/weekly-review.model';

@Injectable()
export class ApiWeeklyReviewRepository extends WeeklyReviewRepository {
  private readonly apiBaseUrl = '/api/weekly-review';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getCurrentWeeklyReview(): Observable<WeeklyReviewState> {
    return this.http.get<WeeklyReviewState>(`${this.apiBaseUrl}/current`);
  }

  public saveWeeklyReview(review: WeeklyReviewState): Observable<WeeklyReviewState> {
    return this.http.put<WeeklyReviewState>(`${this.apiBaseUrl}/current`, review);
  }

  public resetWeeklyReview(): Observable<WeeklyReviewState> {
    return this.http.post<WeeklyReviewState>(`${this.apiBaseUrl}/reset`, {});
  }
}