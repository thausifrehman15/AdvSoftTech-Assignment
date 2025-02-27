import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'auth-app',
  standalone: true, // <-- Add standalone to use Angular's modern approach
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  imports: [CommonModule, ReactiveFormsModule] // <-- Import CommonModule and ReactiveFormsModule
})
export class AuthComponent {
  showLogin: boolean = true;
  authForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.createForm();
  }

  createForm() {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.minLength(6)]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'mismatch': true };
    }
    return null;
  }

  toggleForm() {
    this.showLogin = !this.showLogin;
    const confirmPasswordControl = this.authForm.get('confirmPassword');
    
    if (this.showLogin) {
      confirmPasswordControl?.clearValidators();
    } else {
      confirmPasswordControl?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    confirmPasswordControl?.updateValueAndValidity();
    this.authForm.reset();
  }

  login() {
    if (this.authForm.valid) {
      this.router.navigate(['/dashboard']);
    }
  }

  register() {
    if (this.authForm.valid) {
      this.router.navigate(['/login']);
    }
  }
}
