import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export abstract class AppStorageService {
  abstract getItem(key: string): string | null;
  abstract setItem(key: string, value: string): void;
  abstract removeItem(key: string): void;
}