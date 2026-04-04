import { Injectable } from '@angular/core';
import { DailyCompletionHistoryRepository } from '../../repositories/daily-completion-history.repository';
import { DailyRotationItem } from '../../models/daily-rotation.model';

@Injectable({
  providedIn: 'root'
})
export class LocalDailyCompletionHistoryService extends DailyCompletionHistoryRepository {

  constructor() { 
    super();
   }

   public  saveTodayCompletionSummary(rotationItems: DailyRotationItem[]): void {

   }
    
}
