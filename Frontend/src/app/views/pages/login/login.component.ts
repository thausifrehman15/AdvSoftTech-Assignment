import { Component, OnInit } from '@angular/core';
import { NgStyle, NgIf, CommonModule } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, AlertComponent } from '@coreui/angular';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PredictionService } from '../../dashboard/prediction.service';
import { tap, catchError, finalize } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { LoginResponse } from '../../dashboard/login-response.interface';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    TextColorDirective,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    NgStyle,
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    AlertComponent,
    CommonModule
  ]
})
export class LoginComponent implements OnInit {
  // Flag to toggle between login and registration forms
  isLoginView = true;
  loginForm: FormGroup;
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  authToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private predictionService: PredictionService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // Initialize forms
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check if redirected from registration
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      this.successMessage = 'Registration successful! Please login with your new account.';
      sessionStorage.removeItem('registrationSuccess');
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Switch between login and registration views
  toggleView(): void {
    this.isLoginView = !this.isLoginView;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Login form submission
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { username, password } = this.loginForm.value;

    this.predictionService.login(username, password).pipe(
      tap(response => {
        console.log('Login response:', response); // Log the full response
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); // Save token to local storage
          this.authToken = response.token; // Store token in component variable
          console.log('Token saved:', response.token);
        }
      }),
      finalize(() => {
        this.loading = false; // Reset loading flag
      })
    ).subscribe({
      next: (response) => {
        console.log('Login successful:', response.message);
        this.router.navigate(['/dashboard']); // Navigate to the dashboard
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = err.message || 'Login failed. Please try again.';
      }
    });
  }

  // Registration form submission
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, username, password } = this.registerForm.value;

    this.predictionService.register(email, username, password).subscribe({
      next: (response) => {
        this.loading = false;
        // Switch to login view after successful registration
        this.isLoginView = true;
        // Set registration success message
        sessionStorage.setItem('registrationSuccess', 'true');
        this.successMessage = 'Registration successful! Please login with your new account.';
        // Reset the form
        this.registerForm.reset();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }

  // Helper methods for form validation errors
  hasError(form: FormGroup, controlName: string, errorName: string): boolean {
    const control = form.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }
}
