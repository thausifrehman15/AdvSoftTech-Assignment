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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Get the auth token and username from localStorage
    const authToken = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    // Clone the request and add auth headers
    let modifiedRequest = request;

    if (authToken) {
      modifiedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      // Add username to URL for specific endpoints that need it
      // List of endpoints that should include username
      const userSpecificEndpoints = [
        '/user/data',
        '/predict',
        '/files',
        '/upload'
      ];

      if (username && userSpecificEndpoints.some(endpoint => request.url.includes(endpoint))) {
        // Get the current URL
        const url = new URL(request.url);
        
        // Add username as query parameter if it's not already present
        if (!url.searchParams.has('username')) {
          url.searchParams.append('username', username);
        }

        // Create new request with modified URL
        modifiedRequest = modifiedRequest.clone({
          url: url.toString()
        });
      }
    }

    // Handle the request and catch any errors
    return next.handle(modifiedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle unauthorized error (e.g., clear local storage and redirect to login)
          localStorage.removeItem('authToken');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        return throwError(() => error);
      })
    );
  }
}
