import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DailyCompletionHistoryRepository } from './../repositories/daily-completion-history.repository';
import { DailyCompletionSummary } from './../models/daily-completion.model';

@Injectable()
export class ApiDailyCompletionHistoryRepository extends DailyCompletionHistoryRepository {
  private readonly apiBaseUrl = '/api/completion-history';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public saveSummary(dailyCompletionSummary: DailyCompletionSummary): Observable<void> {
    return this.http.put<DailyCompletionSummary>(
      `${this.apiBaseUrl}/${dailyCompletionSummary.date}`,
      dailyCompletionSummary
    ).pipe(
      map(() => void 0)
    );
  }

  public getSummaries(): Observable<DailyCompletionSummary[]> {
    return this.http.get<DailyCompletionSummary[]>(this.apiBaseUrl);
  }
}