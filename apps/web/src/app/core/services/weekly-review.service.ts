import { Injectable } from '@angular/core';
import { WeeklyReviewState } from '../models/weekly-review.model';

const STORAGE_KEY = 'lifeCopilot.weeklyReview';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewService {
  public getCurrentWeeklyReview(): WeeklyReviewState {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      return JSON.parse(stored) as WeeklyReviewState;
    }

    const review = this.createDefaultWeeklyReview();
    this.saveWeeklyReview(review);
    return review;
  }

  public saveWeeklyReview(review: WeeklyReviewState): void {
    const updatedReview: WeeklyReviewState = {
      ...review,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReview));
  }

  public resetWeeklyReview(): WeeklyReviewState {
    const review = this.createDefaultWeeklyReview();
    this.saveWeeklyReview(review);
    return review;
  }

  private createDefaultWeeklyReview(): WeeklyReviewState {
    const now = new Date().toISOString();

    return {
      id: 'current-weekly-review',
      weekStartDate: this.getStartOfWeek(new Date()),
      anchorGoalIds: [],
      infrastructureGoalId: null,
      maintenanceGoalIds: [],
      creativeGoalId: null,
      notes: '',
      createdAt: now,
      updatedAt: now
    };
  }

  private getStartOfWeek(date: Date): string {
    const copy = new Date(date);
    const day = copy.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy.toISOString();
  }
}