import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private userService: UserService, private router: Router) {}

  login() {
    if (this.userService.login(this.username, this.password)) {
      this.router.navigate(['/']);
    } else {
      alert('Invalid credentials');
    }
  }
}
