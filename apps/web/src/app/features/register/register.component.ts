import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
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
    error = '';
    loading = false;

  ngOnInit(): void {
  }

  public register(): void {
    this.loading = true;
    this.authService.register(this.registerRequest).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.error = error.error?.title;
      }
    });
  }

}
