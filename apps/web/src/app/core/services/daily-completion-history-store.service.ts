import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../repositories/daily-completion-history.repository';
import { DailyCompletionSummary } from '../models/daily-completion.model';

@Injectable({
  providedIn: 'root'
})
export class DailyCompletionHistoryStoreService {

  constructor(private dailyCompletionHistoryRepository: DailyCompletionHistoryRepository) { }

  public saveSummary(dailyCompletionSummary: DailyCompletionSummary): void {
    this.dailyCompletionHistoryRepository.saveSummary(dailyCompletionSummary);
  }

  public getSummaries(): DailyCompletionSummary[] {
    return this.dailyCompletionHistoryRepository.getSummaries();
  }
}
