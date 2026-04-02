import { Injectable } from '@angular/core';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { StorageKeyService } from './storage-key.service';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class WeeklyReviewService {

  constructor(
    private readonly storageKeyService: StorageKeyService,
    private readonly localStorageService: LocalStorageService
  ) {}

  private get storageKey(): string {
    return this.storageKeyService.forCurrentUser('weeklyReview');
  }

  private migrateLegacyIfNeeded(): void {
        const newKey = this.storageKeyService.forCurrentUser('weeklyReview');
        const legacyKey = this.storageKeyService.legacy('weeklyReview');

        const hasNewValue = this.localStorageService.getItem(newKey);
        if (hasNewValue) {
            return;
        }

        const legacyValue = this.localStorageService.getItem(legacyKey);
        if (!legacyValue) {
            return;
        }

        this.localStorageService.setItem(newKey, legacyValue);
        }

  public getCurrentWeeklyReview(): WeeklyReviewState {
    this.migrateLegacyIfNeeded();
    const stored = this.localStorageService.getItem(this.storageKey);

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

    this.localStorageService.setItem(this.storageKey, JSON.stringify(updatedReview));
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