import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import { Goal } from "./../models/goal.model";
import { GoalRepository } from "./../repositories/goal.repository";
import { ApiGoal } from "./../models/api/api-goal.model";
import { fromApiGoal, toApiGoal } from "../mappers/goal-api.mappers";

@Injectable()
export class ApiGoalRepository extends GoalRepository {
  private readonly apiBaseUrl = "/api/goals";

  constructor(private readonly http: HttpClient) {
    super();
  }

  public getGoals(): Observable<Goal[]> {
    return this.http.get<ApiGoal[]>(this.apiBaseUrl).pipe(
      map(goals => goals.map(fromApiGoal))
    );
  }

  public getGoalById(id: string): Observable<Goal | undefined> {
    return this.http.get<ApiGoal>(`${this.apiBaseUrl}/${id}`).pipe(
      map(fromApiGoal),
      catchError(error => {
        if (error?.status === 404) {
          return of(undefined);
        }
        return throwError(() => error);
      })
    );
  }

  public addGoal(goal: Goal): Observable<Goal> {
    return this.http.post<ApiGoal>(this.apiBaseUrl, toApiGoal(goal)).pipe(
      map(fromApiGoal)
    );
  }

  public updateGoal(goal: Goal): Observable<Goal> {
    return this.http.put<ApiGoal>(`${this.apiBaseUrl}/${goal.id}`, toApiGoal(goal)).pipe(
      map(fromApiGoal)
    );
  }

  public archiveGoalById(id: string): Observable<Goal> {
    return this.getGoalById(id).pipe(
      switchMap(existingGoal => {
        if (!existingGoal) {
          return of(<Goal>{});
        }

        return this.updateGoal({
          ...existingGoal,
          status: 'archived',
          updatedAt: new Date().toISOString()
        });
      })
    );
  }

  public markGoalTouched(id: string): Observable<Goal> {
    return this.getGoalById(id).pipe(
      switchMap(existingGoal => {
        if (!existingGoal) {
          return of(<Goal>{});
        }

        const now = new Date().toISOString();

        return this.updateGoal({
          ...existingGoal,
          lastTouchedAt: now,
          updatedAt: now
        });
      })
    );
  }

  public deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`);
  }
}