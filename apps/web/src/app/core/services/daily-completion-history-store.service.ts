import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../repositories/daily-completion-history.repository';
import { DailyCompletionSummary } from '../models/daily-completion.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DailyCompletionHistoryStoreService {

  constructor(private dailyCompletionHistoryRepository: DailyCompletionHistoryRepository) { }

  public saveSummary(dailyCompletionSummary: DailyCompletionSummary): Observable<void> {
    return this.dailyCompletionHistoryRepository.saveSummary(dailyCompletionSummary);
  }

  public getSummaries(): Observable<DailyCompletionSummary[]> {
    return this.dailyCompletionHistoryRepository.getSummaries();
  }
}
