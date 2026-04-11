import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailyRotationRepository } from './../repositories/daily-rotation.repository';
import { DailyRotationItem } from './../models/daily-rotation.model';

@Injectable()
export class ApiDailyRotationRepository extends DailyRotationRepository {
  private readonly apiBaseUrl = '/api/daily-rotation';

  constructor(private readonly http: HttpClient) {
    super();
  }

  public saveRotationForDate(date: string, items: DailyRotationItem[]): Observable<DailyRotationItem[]> {
    return this.http.put<DailyRotationItem[]>(`${this.apiBaseUrl}/${date}`, {
      date,
      items
    });
  }

  public getRotationForDate(date: string): Observable<DailyRotationItem[]> {
    return this.http.get<DailyRotationItem[]>(`${this.apiBaseUrl}/${date}`);
  }

  public clearRotationForDate(date: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${date}`);
  }
}