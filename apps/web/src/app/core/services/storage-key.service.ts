import { Injectable } from '@angular/core';
import { UserContextService } from './user-context.service';

type StorageEntity =
  | 'goals'
  | 'inbox'
  | 'weeklyReview'
  | 'dailyRotation';

@Injectable({
  providedIn: 'root'
})
export class StorageKeyService {
  private readonly appPrefix = 'lifeCopilot';

  constructor(private readonly userContextService: UserContextService) {}

  public forCurrentUser(entity: StorageEntity): string {
    const userId = this.userContextService.getCurrentUserId();
    const sanitizedUserId = this.sanitizeUserId(userId);
    return `${this.appPrefix}.users.${sanitizedUserId}.${entity}`;
  }

  public legacy(entity: StorageEntity): string {
    return `${this.appPrefix}.${entity}`;
  }

  private sanitizeUserId(userId: string): string {
    return userId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  }
}