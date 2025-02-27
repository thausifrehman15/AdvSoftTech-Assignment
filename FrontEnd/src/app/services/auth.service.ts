import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = 'https://dummyapi.io/login';
  private registerUrl = 'https://dummyapi.io/register';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.loginUrl, { email, password });
  }

  register(email: string, password: string): Observable<any> {
    return this.http.post<any>(this.registerUrl, { email, password });
  }
}
