import { Injectable } from '@angular/core';

export type ThemePreference = 'light' | 'dark';

const STORAGE_KEY = 'life-copilot-theme';
const DARK_THEME_CLASS = 'app-dark-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme: ThemePreference = this.getInitialTheme();

  constructor() {
    this.applyTheme(this.currentTheme);
  }

  public get theme(): ThemePreference {
    return this.currentTheme;
  }

  public get isDarkMode(): boolean {
    return this.currentTheme === 'dark';
  }

  public toggleTheme(): ThemePreference {
    const nextTheme: ThemePreference = this.isDarkMode ? 'light' : 'dark';
    this.setTheme(nextTheme);
    return nextTheme;
  }

  public setTheme(theme: ThemePreference): void {
    this.currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): ThemePreference {
    const savedTheme = localStorage.getItem(STORAGE_KEY);

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemePreference): void {
    document.documentElement.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }
}
