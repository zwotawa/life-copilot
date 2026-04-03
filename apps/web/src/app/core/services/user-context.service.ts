import { Injectable } from '@angular/core';
import { MockAuthService } from '../auth/mock-auth.service';
import { CurrentUser } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {

  constructor(private mockAuthService: MockAuthService) { }

  public getCurrentUserId(): string {
    return this.mockAuthService.getCurrentUser()?.id || 'local-demo-user';
  }

  public getCurrentUser(): CurrentUser {
    const user = this.mockAuthService.getCurrentUser();

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
    return this.mockAuthService.isAuthenticated();
  } 

}