import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/auth.model';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {

  constructor(private authService: AuthService) { }

  public getCurrentUserId(): string {
    return this.authService.getCurrentUser()?.id || 'local-demo-user';
  }

  public getCurrentUser(): CurrentUser {
    const user = this.authService.getCurrentUser();

    if (user) {
      return user;
    }

    return {
      id: 'anonymous',
      email: null,
      displayName: null,
      isAuthenticated: false
    };
  }

  public isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  } 

}