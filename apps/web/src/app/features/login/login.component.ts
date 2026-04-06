import { Component } from '@angular/core';
import { Router } from '@angular/router';
  import { MockAuthService } from '../../core/auth/mock-auth.service';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  public email = '';
  public password = '';
  public error = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  public async login(): Promise<void> {
    this.error = '';

    try {
      await this.authService.signIn(this.email, this.password);
      await this.router.navigate(['/']);
    } catch (error) {
      console.error(error);
      this.error = 'Unable to sign in.';
    }
  }
}