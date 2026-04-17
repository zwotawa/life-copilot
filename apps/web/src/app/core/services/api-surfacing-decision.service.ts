import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SurfacingDecisionRepository } from './../repositories/surfacing-decision.repository';
import { SurfacingDecisionEvent } from './../models/surfacing-decision-event.model';

@Injectable({
  providedIn: 'root'
})
export class ApiSurfacingDecisionService extends SurfacingDecisionRepository {
  private readonly apiBaseUrl = '/api/surfacing-decisions';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getEvents(): Observable<SurfacingDecisionEvent[]> {
    return this.http.get<SurfacingDecisionEvent[]>(this.apiBaseUrl);
  }

  public addEvent(event: SurfacingDecisionEvent): Observable<SurfacingDecisionEvent> {
    return this.http.post<SurfacingDecisionEvent>(this.apiBaseUrl, event);
  }

  public addEvents(events: SurfacingDecisionEvent[]): Observable<SurfacingDecisionEvent[]> {
    return this.http.post<SurfacingDecisionEvent[]>(`${this.apiBaseUrl}/batch`, events);
  }
}