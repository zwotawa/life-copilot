import { Injectable } from "@angular/core";
import { GoalProgressRepository } from "../repositories/goal-progress.repository";
import { Observable } from "rxjs";
import { GoalProgressEvent } from "../models/goal-progress-event.model";

@Injectable({
    providedIn: 'root'
})
export class GoalProgressStoreService {

    constructor(private goalProgressRepository: GoalProgressRepository) {}

    public getEventsForGoal(goalId: string): Observable<GoalProgressEvent[]> {
        return this.goalProgressRepository.getEventsForGoal(goalId);
    }

    public addEvent(event: GoalProgressEvent): Observable<GoalProgressEvent> {
        return this.goalProgressRepository.addEvent(event);
    }

    public deleteEvent(id: string): Observable<void> {
        return this.goalProgressRepository.deleteEvent(id);
    }

    public getEventBySourceItemId(sourceItemId: string): Observable<GoalProgressEvent | undefined> {
        return this.goalProgressRepository.getEventBySourceItemId(sourceItemId);
    }

}