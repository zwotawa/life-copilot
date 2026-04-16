import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { GoalProgressRepository } from './../repositories/goal-progress.repository';
import { GoalProgressEvent } from './../models/goal-progress-event.model';

@Injectable()
export class ApiGoalProgressRepository extends GoalProgressRepository {
  private readonly apiBaseUrl = '/api/goal-progress';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getEventsForGoal(goalId: string): Observable<GoalProgressEvent[]> {
    return this.http.get<GoalProgressEvent[]>(`${this.apiBaseUrl}/goal/${goalId}`);
  }

  public addEvent(event: GoalProgressEvent): Observable<GoalProgressEvent> {
    return this.http.post<GoalProgressEvent>(this.apiBaseUrl, event);
  }

  public deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }

  public getEventBySourceItemId(sourceItemId: string): Observable<GoalProgressEvent | undefined> {
    return this.http.get<GoalProgressEvent>(`${this.apiBaseUrl}/source-item/${sourceItemId}`).pipe(
      catchError(error => error?.status === 404 ? of(undefined) : (() => { throw error; })())
    );
  }

  public override getAllEvents(): Observable<GoalProgressEvent[]> {
    return this.http.get<GoalProgressEvent[]>(`${this.apiBaseUrl}`);
  }
}