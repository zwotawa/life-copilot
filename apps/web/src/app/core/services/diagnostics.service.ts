import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

import { BackendVersionInfo } from '../models/backend-version.model';
import { CurrentUser } from '../models/auth.model';
import { AuthService } from '../auth/auth.service';

export interface AuthDiagnosticsSnapshot {
  isAuthenticated: boolean;
  currentUserEmail: string | null;
  tokenPresent: boolean;
  tokenExpired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  public getBackendVersion(): Observable<BackendVersionInfo> {
    return this.http.get<BackendVersionInfo>('/api/meta/version');
  }

  public getAuthSnapshot(): AuthDiagnosticsSnapshot {
    const token = this.authService.getAccessToken();
    const currentUser = this.authService.getCurrentUser();

    return {
      isAuthenticated: this.authService.isAuthenticated(),
      currentUserEmail: currentUser?.email ?? null,
      tokenPresent: !!token,
      tokenExpired: this.authService.isTokenExpired(token)
    };
  }

  public readonly authSnapshot$: Observable<AuthDiagnosticsSnapshot> =
    this.authService.currentUser$.pipe(
      map((currentUser: CurrentUser | null) => {
        const token = this.authService.getAccessToken();

        return {
          isAuthenticated: this.authService.isAuthenticated(),
          currentUserEmail: currentUser?.email ?? null,
          tokenPresent: !!token,
          tokenExpired: this.authService.isTokenExpired(token)
        };
      }),
      startWith(this.getAuthSnapshot())
    );

  public checkApiReachable(): Observable<boolean> {
    return this.getBackendVersion().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}