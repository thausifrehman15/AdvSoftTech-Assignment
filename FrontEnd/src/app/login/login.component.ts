import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private apiService: ApiService) {}

  onSubmit() {
    this.apiService.login({ email: this.email, password: this.password })
      .then(response => {
        console.log('Login successful:', response);
      })
      .catch(error => {
        console.error('Login failed:', error);
      });
  }
}
