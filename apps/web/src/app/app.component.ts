import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MockAuthService } from './core/services/mock-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'life-copilot';

  constructor(
    private mockAuthService: MockAuthService,
    private readonly router: Router
  ) {}

  public async logout(): Promise<void> {
    await this.mockAuthService.signOut();
    await this.router.navigate(['/login']);
  }
}
