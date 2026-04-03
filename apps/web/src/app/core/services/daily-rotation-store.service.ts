import { Injectable } from '@angular/core';
import { RotationEngineService } from './rotation-engine.service';
import { DailyRotationRepository } from '../repositories/daily-rotation.repository';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';

@Injectable({
  providedIn: 'root'
})
export class DailyRotationStoreService {

  constructor(
    private rotationEngineService: RotationEngineService,
    private dailyRotationRepository: DailyRotationRepository
  ) { }

  public generateDailyRotationForDate(
    date: string,
    goals: Goal[],
    weeklyReview: WeeklyReviewState
  ): DailyRotationItem[] {
    const items = this.rotationEngineService.generateDailyRotation(goals, weeklyReview)
      .map(item => ({
        ...item,
        date
      }));
    this.dailyRotationRepository.saveRotationForDate(date, items);
    return items;
  }

  public loadRotationItemsForDate(date: string): DailyRotationItem[] {
    return this.dailyRotationRepository.getRotationForDate(date);
  }

  public saveRotationItemsForDate(date: string, items: DailyRotationItem[]): void {
    this.dailyRotationRepository.saveRotationForDate(date, items);
  }

  public clearRotationItemsForDate(date: string): void {
    this.dailyRotationRepository.clearRotationForDate(date);
  }
}
