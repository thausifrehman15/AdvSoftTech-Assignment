import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { LoginResponse, LoginRequest, RegisterResponse, RegisterRequest, PredictionResponse, PredictionRequest, FileUploadResponse, FileListResponse, FileDetailResponse, FileStatusResponse, UserDataResponse } from './prediction.interface';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = environment.apiUrl;
  private authToken: string | null = null;
  private username: string | null = null;
  
  private useMockData = true;

  constructor(private http: HttpClient) {
    this.authToken = localStorage.getItem('authToken');
    this.username = localStorage.getItem('username');
  }

  // Helper method to get auth headers
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (this.authToken) {
      headers = headers.set('Authorization', `Bearer ${this.authToken}`);
    }
    
    return headers;
  }

  login(username: string, password: string): Observable<LoginResponse> {
    if (this.useMockData) {
      // Mock successful login
      return of({
        token: 'mock-token-' + Math.random().toString(36).substring(2),
        user: {
          id: '1',
          username: username,
          email: username + '@example.com'
        },
        message: 'Login successful'
      }).pipe(
        delay(800), // Simulate network delay
        tap(response => {
          this.authToken = response.token;
          this.username = username;
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('username', username);
        })
      );
    }
    
    // Real API call
    const endpoint = `${this.apiUrl}/auth/login`;
    const request: LoginRequest = { username, password };
    
    return this.http.post<LoginResponse>(endpoint, request).pipe(
      tap(response => {
        if (response && response.token) {
          this.authToken = response.token;
          this.username = username;
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('username', username); 
        }
      }),
      catchError(this.handleError)
    );
  }

  register(email: string, username: string, password: string): Observable<RegisterResponse> {
    if (this.useMockData) {
      // Mock successful registration
      return of({
        success: true,
        message: 'Registration successful',
        user: {
          id: '2',
          username: username,
          email: email
        }
      }).pipe(delay(800)); // Simulate network delay
    }
    
    // Real API call
    const endpoint = `${this.apiUrl}/auth/register`;
    const request: RegisterRequest = { email, username, password };
    
    return this.http.post<RegisterResponse>(endpoint, request).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.authToken = null;
    this.username = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.authToken;
  }

  getCurrentUsername(): string | null {
    return this.username;
  }

  predictText(text: string): Observable<PredictionResponse> {
    // Real API call
    const endpoint = `${this.apiUrl}/predict`;
    const payload: PredictionRequest = { text };
    return this.http.post<PredictionResponse>(endpoint, payload, { headers: this.getHeaders() });
  }

  // File upload
  uploadCsvForPrediction(file: File): Observable<FileUploadResponse> {    
    // Real API call
    const endpoint = `${this.apiUrl}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FileUploadResponse>(endpoint, formData, { headers: this.getHeaders() });
  }

  // Get file list
  getFiles(): Observable<FileListResponse> {
    // Real API call
    const endpoint = `${this.apiUrl}/files`;
    return this.http.get<FileListResponse>(endpoint, { headers: this.getHeaders() });
  }

  // Get file details
  getFileDetails(fileId: string): Observable<FileDetailResponse> {
    // Real API call
    const endpoint = `${this.apiUrl}/files/${fileId}`;
    return this.http.get<FileDetailResponse>(endpoint, { headers: this.getHeaders() });
  }

  // Check file status
  checkFileStatus(fileId: string): Observable<FileStatusResponse> {
    // Real API call
    const endpoint = `${this.apiUrl}/files/${fileId}/status`;
    return this.http.get<FileStatusResponse>(endpoint, { headers: this.getHeaders() });
  }

  // Get user data
  getUserData(): Observable<UserDataResponse> {
    // Real API call
    const endpoint = `${this.apiUrl}/user/data`;
    return this.http.get<UserDataResponse>(endpoint, { headers: this.getHeaders() });
  }

  /**
   * Save a prediction to the user's history
   * @param prediction The prediction object to save
   */
  savePredictionToHistory(prediction: any): void {
    // For a real API, you would send this to the server
    // Since we're using mock data, we'll update local storage or call the mock function
    
    if (this.authToken) {
      // Convert the timestamp to string format if it's a Date object
      const predictionToSave = {
        ...prediction,
        timestamp: prediction.timestamp instanceof Date 
          ? prediction.timestamp.toISOString() 
          : prediction.timestamp
      };
      
      // You could also store in localStorage for persistence between page refreshes
      try {
        const savedPredictions = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
        savedPredictions.unshift(predictionToSave);
        localStorage.setItem('predictionHistory', JSON.stringify(savedPredictions.slice(0, 50))); // Keep last 50
      } catch (e) {
        console.error('Failed to save prediction to localStorage:', e);
      }
    }
  }

  private handleError(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}