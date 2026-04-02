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

  public generateDailyRotation(
    goals: Goal[],
    weeklyReview: WeeklyReviewState
  ): DailyRotationItem[] {
    const items = this.rotationEngineService.generateDailyRotation(goals, weeklyReview);
    this.dailyRotationRepository.saveRotationItems(items);
    return items;
  }

  public loadRotationItems(): DailyRotationItem[] {
    return this.dailyRotationRepository.loadRotationItems();
  }

  public saveRotationItems(items: DailyRotationItem[]): void {
    this.dailyRotationRepository.saveRotationItems(items);
  }

  public clearRotationItems(): void {
    this.dailyRotationRepository.clearRotationItems();
  }
}
