import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get auth token and username from localStorage
    const authToken = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    // Skip adding auth headers for login/register requests
    if (request.url.includes('/auth/login') || request.url.includes('/auth/register')) {
      return next.handle(request);
    }

    // Clone the request and add auth headers
    let modifiedRequest = request;
    
    // Add headers based on what we have
    if (authToken || username) {
      const headers: {[key: string]: string} = {};
      
      if (authToken) {
        headers['authToken'] = `${authToken}`;
      }
      
      if (username) {
        headers['username'] = username;
      }
      
      // For FormData requests, we don't want to set Content-Type
      if (!(request.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      modifiedRequest = request.clone({
        setHeaders: headers
      });
    }

    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('username');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}