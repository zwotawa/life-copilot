import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'life-copilot';

  constructor(
    private authService: AuthService,
    private readonly router: Router,
    private readonly themeService: ThemeService
  ) {}

  public async logout(): Promise<void> {
    await this.authService.signOut().then(
      () => this.router.navigate(['/login'])
    );
  }

  public get isSignedIn(): boolean {
    return this.authService.isSignedIn();
  }

  public get isDarkMode(): boolean {
    return this.themeService.isDarkMode;
  }

  public get nextThemeLabel(): string {
    switch (this.themeService.theme) {
      case 'light':
        return 'Dark mode';
      case 'dark':
        return 'Pink mode';
      case 'pink':
        return 'Light mode';
    }
  }

  public get nextThemeIcon(): string {
    switch (this.themeService.theme) {
      case 'light':
        return 'dark_mode';
      case 'dark':
        return 'favorite';
      case 'pink':
        return 'light_mode';
    }
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
