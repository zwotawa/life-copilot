import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  public email = '';
  public password = '';
  public error = '';
  public loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  public async login(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      (await this.authService.signIn(this.email, this.password).then(
         () => {
          this.loading = false;
          this.router.navigate(['/']);
        }
      ))
    } catch (error) {
      this.loading = false;
      console.error(error);
      this.error = 'Unable to sign in.';
    }
  }
  
  
}