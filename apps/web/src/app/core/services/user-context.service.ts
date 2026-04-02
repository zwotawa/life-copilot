import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private readonly fallbackUserId = 'local-demo-user';

  public getCurrentUserId(): string {
    return this.fallbackUserId;
  }
}