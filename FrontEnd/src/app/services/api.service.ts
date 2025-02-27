import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  login(credentials: { email: string, password: string }): Promise<any> {
    // Dummy API call for login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email === 'test@example.com' && credentials.password === 'password') {
          resolve({ message: 'Login successful' });
        } else {
          reject({ message: 'Invalid email or password' });
        }
      }, 1000);
    });
  }

  register(userData: { name: string, email: string, password: string }): Promise<any> {
    // Dummy API call for registration
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (userData.email === 'test@example.com') {
          reject({ message: 'Email already exists' });
        } else {
          resolve({ message: 'Registration successful' });
        }
      }, 1000);
    });
  }
}
