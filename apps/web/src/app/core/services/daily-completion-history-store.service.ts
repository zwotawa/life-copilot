import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../repositories/daily-completion-history.repository';
import { DailyRotationItem } from '../models/daily-rotation.model';

@Injectable({
  providedIn: 'root'
})
export class DailyCompletionHistoryStoreService {

  constructor(private dailyCompletionHistoryRepository: DailyCompletionHistoryRepository) { }

  saveTodayCompletionSummary(items: DailyRotationItem[]): void {
    this.dailyCompletionHistoryRepository.saveTodayCompletionSummary(items);
  }
}
