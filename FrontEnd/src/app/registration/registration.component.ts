import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent {
  name: string = '';
  email: string = '';
  password: string = '';

  constructor(private apiService: ApiService) {}

  onSubmit() {
    this.apiService.register({ name: this.name, email: this.email, password: this.password })
      .then(response => {
        console.log('Registration successful:', response);
      })
      .catch(error => {
        console.error('Registration failed:', error);
      });
  }
}
