import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RegisterRequest } from 'src/app/core/models/api/api-register-request.model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
    registerRequest: RegisterRequest = <RegisterRequest>{};
    error: string = '';

  ngOnInit(): void {
  }

  public register(): void {
    this.authService.register(this.registerRequest).subscribe({
      next: () => this.router.navigate(['/login'])
    });
  }

}
