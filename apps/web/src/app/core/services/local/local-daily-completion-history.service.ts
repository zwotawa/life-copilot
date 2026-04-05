import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../../repositories/daily-completion-history.repository';
import { DailyCompletionSummary } from '../../models/daily-completion.model';
import { StorageKeyService } from './storage-key.service';
import { LocalStorageService } from './local-storage.service';

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

   public saveSummary(dailyCompletionSummary: DailyCompletionSummary): void {
     const currentSummaries = this.getSummaries();
     const updatedSummaries = currentSummaries.map(summary => {
      return summary.date === dailyCompletionSummary.date
      ? dailyCompletionSummary
      : summary
     })
     this.saveSummaries(updatedSummaries);
   }

   private saveSummaries(dailyCompletionSummaries: DailyCompletionSummary[]): void {
      this.localStorageService.setItem(this.storageKey, JSON.stringify(dailyCompletionSummaries));
   }

   public getSummaries(): DailyCompletionSummary[] {
     this.migrateLegacyIfNeeded();
     
      const stored = this.localStorageService.getItem(this.storageKey);
      if (!stored) return [];
      return JSON.parse(stored) as DailyCompletionSummary[];
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
