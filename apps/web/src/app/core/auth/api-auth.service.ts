import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { CurrentUser } from '../models/auth.model';
import { RegisterRequest } from '../models/api/api-register-request.model';

interface AuthResponse {
  user: CurrentUser;
  accessToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiAuthService extends AuthService {
  private currentUser: CurrentUser | null = null;
  private readonly accessTokenStorageKey = 'lifeCopilot.auth.accessToken';
  private readonly apiBaseUrl = '/api';

  constructor(private http: HttpClient) {
    super();
  }

  public getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.currentUser?.isAuthenticated;
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenStorageKey);
  }

  public async signIn(email: string, password: string): Promise<CurrentUser> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, {
        email,
        password
      })
    );

    this.currentUser = response.user;
    localStorage.setItem(this.accessTokenStorageKey, response.accessToken);
    return response.user;
  }

  public async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem(this.accessTokenStorageKey);
  }

  public async restoreSession(): Promise<CurrentUser | null> {
    const token = this.getAccessToken();

    if (!token || this.isTokenExpired(token)) {
      return this.clearSession();
    }

    try {
      const user = await firstValueFrom(
        this.http.get<CurrentUser>(`${this.apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      );

      this.currentUser = user;
      return user;
    } catch {
      return this.clearSession();
    }
  }

  public isSignedIn(): boolean {
    return !!this.currentUser
  }

  public register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, req)
  }

  public isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload?.exp;

      if (!exp) {
        return true;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return exp <= nowInSeconds;
    } catch {
      return true;
    }
  }

  public hasValidSession(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  public clearSession(): null {
    this.currentUser = null;
    localStorage.removeItem(this.accessTokenStorageKey);
    return null;
  }
}