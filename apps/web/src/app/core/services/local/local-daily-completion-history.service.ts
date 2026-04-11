import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../../repositories/daily-completion-history.repository';
import { DailyCompletionSummary } from '../../models/daily-completion.model';
import { StorageKeyService } from './storage-key.service';
import { LocalStorageService } from './local-storage.service';
import { map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocalDailyCompletionHistoryService extends DailyCompletionHistoryRepository {

  constructor(
    private storageKeyService: StorageKeyService,
    private localStorageService: LocalStorageService
  ) { 
    super();
   }

   public saveSummary(dailyCompletionSummary: DailyCompletionSummary): Observable<void> {
    return this.getSummaries().pipe(
      map(currentSummaries => {
        const existingIndex = currentSummaries.findIndex(
          summary => summary.date === dailyCompletionSummary.date
        );

        let updatedSummaries: DailyCompletionSummary[];

        if (existingIndex >= 0) {
          updatedSummaries = currentSummaries.map(summary =>
            summary.date === dailyCompletionSummary.date
              ? dailyCompletionSummary
              : summary
          );
        } else {
          updatedSummaries = [...currentSummaries, dailyCompletionSummary];
        }

        updatedSummaries.sort((a, b) => a.date.localeCompare(b.date));
        this.saveSummaries(updatedSummaries);
        return void 0;
      })
    );
  }

   private saveSummaries(dailyCompletionSummaries: DailyCompletionSummary[]): void {
      this.localStorageService.setItem(this.storageKey, JSON.stringify(dailyCompletionSummaries));
   }

   public getSummaries(): Observable<DailyCompletionSummary[]> {
    this.migrateLegacyIfNeeded();

    const stored = this.localStorageService.getItem(this.storageKey);
    if (!stored) return of([]);

    try {
      const parsed = JSON.parse(stored) as DailyCompletionSummary[];
      return of(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Error parsing completion history from localStorage:', error);
      return of([]);
    }
  }

   private get storageKey(): string {
    return this.storageKeyService.forCurrentUser('completionHistory');
  }

    private migrateLegacyIfNeeded(): void {
    const newKey = this.storageKeyService.forCurrentUser('completionHistory');
    const legacyKey = this.storageKeyService.legacy('completionHistory');

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

}
