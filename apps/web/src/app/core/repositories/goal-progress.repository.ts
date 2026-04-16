import { Observable } from 'rxjs';
import { GoalProgressEvent } from '../models/goal-progress-event.model';

export abstract class GoalProgressRepository {
  public abstract getEventsForGoal(goalId: string): Observable<GoalProgressEvent[]>;
  public abstract addEvent(event: GoalProgressEvent): Observable<GoalProgressEvent>;
  public abstract deleteEvent(id: string): Observable<void>;

  // useful for undo of a daily checkbox
  public abstract getEventBySourceItemId(sourceItemId: string): Observable<GoalProgressEvent | undefined>;
  public abstract getAllEvents(): Observable<GoalProgressEvent[]>;
}