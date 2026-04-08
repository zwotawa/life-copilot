import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private readonly apiBaseUrl = '/api';

  constructor(private authService: AuthService) {}

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

    return next.handle(authorizedRequest);
  }
}