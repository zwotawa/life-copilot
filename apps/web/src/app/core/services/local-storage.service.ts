import { Injectable } from '@angular/core';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService extends AppStorageService {
  public getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  public setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  public removeItem(key: string): void {
    localStorage.removeItem(key);
  }
}