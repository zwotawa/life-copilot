import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GoalProgressRepository } from '../../repositories/goal-progress.repository';
import { GoalProgressEvent } from '../../models/goal-progress-event.model';
import { LocalStorageService } from './local-storage.service';
import { StorageKeyService } from './storage-key.service';

@Injectable()
export class LocalGoalProgressRepository extends GoalProgressRepository {
  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly storageKeyService: StorageKeyService
  ) {
    super();
  }

  private get storageKey(): string {
    return this.storageKeyService.forCurrentUser('goalProgress' as any);
  }

  private readEvents(): GoalProgressEvent[] {
    try {
      const raw = this.localStorageService.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as GoalProgressEvent[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing goal progress events:', error);
      return [];
    }
  }

  private saveEvents(events: GoalProgressEvent[]): void {
    this.localStorageService.setItem(this.storageKey, JSON.stringify(events));
  }

  public getEventsForGoal(goalId: string): Observable<GoalProgressEvent[]> {
    return of(this.readEvents().filter(event => event.goalId === goalId));
  }

  public addEvent(event: GoalProgressEvent): Observable<GoalProgressEvent> {
    const events = this.readEvents();
    const updated = [event, ...events];
    this.saveEvents(updated);
    return of(event);
  }

  public deleteEvent(id: string): Observable<void> {
    const events = this.readEvents();
    this.saveEvents(events.filter(event => event.id !== id));
    return of(void 0);
  }

  public getEventBySourceItemId(sourceItemId: string): Observable<GoalProgressEvent | undefined> {
    return of(this.readEvents().find(event => event.sourceItemId === sourceItemId));
  }
}