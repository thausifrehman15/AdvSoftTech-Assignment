import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import {
  mockPredictText,
  mockUploadCsvFile,
  mockGetFiles,
  mockGetFileDetails,
  mockCheckFileStatus,
  mockGetUserData,
  addPredictionToHistory
} from './datafiles';
import { PredictionResponse } from '../dashboard/prediction-response.interface';
import { UploadCsvResponse } from './upload-csv-response.interface';
import { RegisterResponse } from './register-response.interface';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private static readonly BULK_PREDICT_ENDPOINT = '/bulk_predict'; // Static constant for the endpoint
  private apiUrl = 'http://127.0.0.1:5000'; // Replace with your actual API URL
  private useMockData = false; // Set to false to use real API
  private authToken: string | null = null;

  constructor(private http: HttpClient) {
    // Check for saved token in local storage
    this.authToken = localStorage.getItem('authToken');
  }

  // Authentication methods
  login(username: string, password: string): Observable<any> {
    if (this.useMockData) {
      return this.mockLogin(username, password);
    }
    
    const endpoint = `${this.apiUrl}/auth/login`;
    return this.http.post<any>(endpoint, { username, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.authToken = response.token;
          localStorage.setItem('authToken', response.token); // Using direct value instead of this.authToken
        }
      }),
      catchError(this.handleError)
    );
  }

  register(email: string, username: string, password: string): Observable<RegisterResponse> {
    const endpoint = `${this.apiUrl}/signup`;
    console.log('Register payload:', { email, username, password }); // Log the payload
    return this.http.post<RegisterResponse>(endpoint, { email, username, password }).pipe(
      tap(response => console.log('Registration response:', response)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    // Clear authentication data
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.authToken;
  }

  private mockLogin(username: string, password: string): Observable<any> {
    // Valid test credentials
    const validUsers = [
      { username: 'testuser', password: 'password123', email: 'test@example.com' },
      { username: 'admin', password: 'admin123', email: 'admin@example.com' }
    ];

    const user = validUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
      const mockToken = `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`;
      this.authToken = mockToken;
      localStorage.setItem('authToken', mockToken); // Fixed: using mockToken instead of response.token
    
      return of({
        token: mockToken,
        user: { 
          username: user.username, 
          email: user.email 
        }
      }).pipe(delay(800)); // Simulate network delay
    } else {
      return throwError(() => new Error('Invalid username or password')).pipe(delay(800));
    }
  }

  private mockRegister(email: string, username: string, password: string): Observable<RegisterResponse> {
    return of({ message: 'User registered successfully (mock)' }).pipe(delay(500));
  }

  // Error handling
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }

  // Get headers with auth token
  private getAuthHeaders(): HttpHeaders {
    // Ensure we never pass null to the Authorization header
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken || ''}` // Use empty string as fallback
    });
  }

  /**
   * Predict sentiment from a single text input
   * @param text Text to analyze
   * @returns Observable with prediction result
   */
  predictText(text: string): Observable<PredictionResponse> {
    if (this.useMockData) {
      return mockPredictText(text);
    }
    
    const endpoint = `${this.apiUrl}/predict`;
    const payload = { text };
    return this.http.post<PredictionResponse>(endpoint, payload).pipe(
      tap(response => console.log('Prediction response:', response))
    );
  }

  /**
   * Upload and process a CSV file for bulk prediction
   * @param file CSV file to process
   * @param username User's username
   * @param email User's email address
   * @returns Observable with file ID for tracking
   */
  uploadCsvForPrediction(file: File, username: string, email: string): Observable<{ fileId: string; name: string; timestamp: string }> {
    if (this.useMockData) {
      return mockUploadCsvFile(file);
    }

    const endpoint = `${this.apiUrl}${PredictionService.BULK_PREDICT_ENDPOINT}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', 'usman');
    formData.append('email', 'usmanakmal2017@gmail.com');

    return this.http.post<{ fileId: string; name: string; timestamp: string }>(endpoint, formData).pipe(
      tap(response => console.log('CSV upload response:', response))
    );
  }

  /**
   * Get list of all files (both completed and pending)  
   * @returns Observable with file lists
   */
  getFiles(): Observable<{ pendingFiles: any[], completedFiles: any[] }> {
    if (this.useMockData) {
      return mockGetFiles();
    }
    
    const endpoint = `${this.apiUrl}/files`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() });
  }

  /**
   * Get detailed results for a specific file
   * @param fileId ID of the file to retrieve
   * @returns Observable with file data and results
   */
  getFileDetails(fileId: string): Observable<any> {
    if (this.useMockData) {
      return mockGetFileDetails(fileId);
    }
    
    const endpoint = `${this.apiUrl}/files/${fileId}`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() });
  }

  /**
   * Check status of a pending file
   * @param fileId ID of the file to check
   * @returns Observable with current status
   */
  checkFileStatus(fileId: string): Observable<{ 
    status: string; 
    progress?: number;
    message?: string; // Add this optional property
  }> {
    if (this.useMockData) {
      return mockCheckFileStatus(fileId);
    }
    
    const endpoint = `${this.apiUrl}/files/${fileId}/status`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() });
  }

  /**
   * Get user data including prediction history and files
   * @returns Observable with user data
   */
  getUserData(): Observable<{ predictionHistory: any[], pendingFiles: any[], completedFiles: any[] }> {
    if (this.useMockData) {
      return mockGetUserData();
    }
    
    const endpoint = `${this.apiUrl}/user/data`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() });
  }

  /**
   * Helper method to add prediction to history (for mock data)
   */
  savePredictionToHistory(prediction: any): void {
    if (this.useMockData) {
      addPredictionToHistory(prediction);
    }
    // If using real API, the history would be saved server-side
  }
}