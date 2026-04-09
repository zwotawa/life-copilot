import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../models/auth.model';
import { LocalStorageService } from '../services/local/local-storage.service';
import { AuthResponse } from '../models/api/api-auth-response.model';
import { Observable, of } from 'rxjs';
import { RegisterRequest } from '../models/api/api-register-request.model';
import { getuid } from 'process';

@Injectable({
  providedIn: 'root'
})
export class MockAuthService extends AuthService {
  
  private readonly authStorageKey = 'lifeCopilot.localAuth.currentUser';

  constructor(
    private localStorageService: LocalStorageService
  ) {
    super();
    this.unsureMockUserExists();
  }

 public getCurrentUser(): CurrentUser | null {
    const raw = this.localStorageService.getItem(this.authStorageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch (error) {
      console.error('Failed to parse current user', error);
      return null;
    }
  }

  public isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return !!user?.isAuthenticated;
  }

  public async signIn(email: string, password: string): Promise<CurrentUser> {
    const normalizedEmail = email.trim().toLowerCase();

    const user: CurrentUser = {
      id: this.toSafeUserId(normalizedEmail || 'local-demo-user'),
      email: normalizedEmail || 'demo@lifecopilot.local',
      displayName: normalizedEmail ? normalizedEmail.split('@')[0] : 'Demo User',
      isAuthenticated: true
    };

    this.localStorageService.setItem(this.authStorageKey, JSON.stringify(user));
    return user;
  }

  public async signOut(): Promise<void> {
    this.localStorageService.removeItem(this.authStorageKey);
  }

  public restoreSession(): Promise<CurrentUser | null> {
    return Promise.resolve(this.getCurrentUser());
  }

  public override getAccessToken(): string | null {
    return null;
  }

  public isSignedIn(): boolean {
    return !!this.getCurrentUser();
  }

  public register(req: RegisterRequest): Observable<AuthResponse> {
    return of({
      user: {
        id: getuid.toString(),
        email: req.email,
        displayName: req.displayName,
        isAuthenticated: true
      },
      accessToken: this.getAccessToken()
    })
  }

  private unsureMockUserExists(): void {
    if (this.getCurrentUser()) {
      return;
    }

    const demoUser: CurrentUser = {
      id: 'local-demo-user',
      email: 'demo@lifecopilot.local',
      displayName: 'Demo User',
      isAuthenticated: true
    };

    this.localStorageService.setItem(this.authStorageKey, JSON.stringify(demoUser));
  }

  private toSafeUserId(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }
}
