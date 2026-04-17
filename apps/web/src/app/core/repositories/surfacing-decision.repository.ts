import { Observable } from 'rxjs';
import { SurfacingDecisionEvent } from '../models/surfacing-decision-event.model';

export abstract class SurfacingDecisionRepository {
  public abstract getEvents(): Observable<SurfacingDecisionEvent[]>;
  public abstract addEvent(event: SurfacingDecisionEvent): Observable<SurfacingDecisionEvent>;
  public abstract addEvents(events: SurfacingDecisionEvent[]): Observable<SurfacingDecisionEvent[]>;
}