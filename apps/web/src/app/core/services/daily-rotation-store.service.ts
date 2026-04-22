import { Injectable } from '@angular/core';
import { RotationEngineService } from './rotation-engine.service';
import { DailyRotationRepository } from '../repositories/daily-rotation.repository';
import { WeeklyReviewState } from '../models/weekly-review.model';
import { Goal } from '../models/goal.model';
import { DailyRotationItem } from '../models/daily-rotation.model';
import { Observable } from 'rxjs';
import { GoalBehaviorEvidence } from './goal-surfacing.service';
import { GoalExecutionContext } from '../models/goal-execution-context.model';

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
    weeklyReview: WeeklyReviewState,
    evidenceByGoalId: Record<string, GoalBehaviorEvidence>,
    executionContextByGoalId: Record<string, GoalExecutionContext>
  ): Observable<DailyRotationItem[]> {
    const items = this.rotationEngineService.generateDailyRotation(goals, weeklyReview, evidenceByGoalId, executionContextByGoalId)
      .map(item => ({
        ...item,
        date
      }));
    return this.dailyRotationRepository.saveRotationForDate(date, items);
  }

  public loadRotationItemsForDate(date: string): Observable<DailyRotationItem[]> {
    return this.dailyRotationRepository.getRotationForDate(date);
  }

  public saveRotationItemsForDate(date: string, items: DailyRotationItem[]): Observable<DailyRotationItem[]> {
    return this.dailyRotationRepository.saveRotationForDate(date, items);
  }

  public clearRotationItemsForDate(date: string): Observable<void> {
    return this.dailyRotationRepository.clearRotationForDate(date);
  }
}
