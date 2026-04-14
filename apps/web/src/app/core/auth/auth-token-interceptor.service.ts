import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly apiBaseUrl = '/api';
  private isHandlingUnauthorized: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();

    const isApiRequest = req.url.startsWith(this.apiBaseUrl);

    if (!token || !isApiRequest) {
      return next.handle(req);
    }

    const authorizedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next.handle(authorizedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isHandlingUnauthorized) {
          this.isHandlingUnauthorized = true;
          this.authService.clearSession();

          this.router.navigate(['/login'], {
            queryParams: {
              sessionExpired: '1'
            }
          }).finally(() => this.isHandlingUnauthorized = false);
        }

        return throwError(() => error);
      })
    );
  }
}