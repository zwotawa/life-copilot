import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'life-copilot';

  constructor(
    private authService: AuthService,
    private readonly router: Router
  ) {}

  public async logout(): Promise<void> {
    await this.authService.signOut().then(
      () => this.router.navigate(['/login'])
    );
  }

  public get isSignedIn(): boolean {
    return this.authService.isSignedIn();
  }
}
