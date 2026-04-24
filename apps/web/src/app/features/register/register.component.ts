import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
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
    @ViewChild('password') passwordInput!: NgModel;

  ngOnInit(): void {
  }

  public register(): void {
    if(this.passwordInput.invalid){
      return;
    }
    this.loading = true;
    this.authService.register(this.registerRequest).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        console.error(error);
        this.loading = false;
        this.error = error.error?.title;
      }
    });
  }

}
