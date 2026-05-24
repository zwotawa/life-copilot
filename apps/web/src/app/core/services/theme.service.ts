import { Injectable } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'pink';

const STORAGE_KEY = 'life-copilot-theme';
const DARK_THEME_CLASS = 'app-dark-theme';
const PINK_THEME_CLASS = 'app-pink-theme';
const THEME_CYCLE: ThemePreference[] = ['light', 'dark', 'pink'];

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

  public get isPinkMode(): boolean {
    return this.currentTheme === 'pink';
  }

  public toggleTheme(): ThemePreference {
    const currentIndex = THEME_CYCLE.indexOf(this.currentTheme);
    const nextTheme = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length];
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

    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'pink') {
      return savedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemePreference): void {
    document.documentElement.classList.toggle(DARK_THEME_CLASS, theme === 'dark');
    document.documentElement.classList.toggle(PINK_THEME_CLASS, theme === 'pink');
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  }
}
