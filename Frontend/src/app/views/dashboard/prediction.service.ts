import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { addPredictionToHistory, mockCheckFileStatus, mockGetFileDataPaginated, mockGetFileDetails, mockGetFiles, mockGetUserData, mockPredictText, mockUploadCsvFile } from './datafiles';
import { PredictionRequest, PredictionResponse } from './prediction.interface';

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = environment.apiUrl || 'https://api.yourdomain.com';
  private useMockData = false;
  private authToken: string | null = null;
  public validUsers = [
    { username: 'testuser', password: 'password123', email: 'test@example.com' },
    { username: 'admin', password: 'admin123', email: 'admin@example.com' }
  ];

  constructor(private http: HttpClient) {
    // Check for saved token in local storage
    this.authToken = localStorage.getItem('authToken');
  }

  // Authentication methods
  login(username: string, password: string): Observable<any> {
    if (this.useMockData) {
      return this.mockLogin(username, password);
    }
    
    const endpoint = `${this.apiUrl}/login`;
    return this.http.post<any>(endpoint, { username, password }).pipe(
      tap(response => {
        if (response && response.token) {
          this.authToken = response.token;
            localStorage.setItem('authToken', response.token);
            if (response.user && response.user.username) {
            localStorage.setItem('username', response.user.username);
            }
        }
      }),
      catchError(this.handleError)
    );
  }

  register(email: string, username: string, password: string): Observable<any> {
    if (this.useMockData) {
      return this.mockRegister(email, username, password);
    }

    const endpoint = `${this.apiUrl}/signup`;
    return this.http.post<any>(endpoint, { email, username, password }).pipe(
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

    const user = this.validUsers.find(u => u.username === username && u.password === password);

    if (user) {
      const mockToken = `mock-jwt-token-${Math.random().toString(36).substring(2, 15)}`;
      this.authToken = mockToken;
      localStorage.setItem('authToken', mockToken); // Fixed: using mockToken instead of response.token
      localStorage.setItem('username', user.username); // Store username for later use
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

  private mockRegister(email: string, username: string, password: string): Observable<any> {
    // Check if username already exists in our mock data

    if (this.validUsers.some(u => u.username === username)) {
      return throwError(() => new Error('Username already exists')).pipe(delay(800));
    }

    if (this.validUsers.some(u => u.email === email)) {
      return throwError(() => new Error('Email already registered')).pipe(delay(800));
    }

    // Registration successful
    this.validUsers.push({ username, password, email }); 
    return of({
      success: true,
      message: 'Registration successful'
    }).pipe(delay(800)); // Simulate network delay
  }

  // Error handling
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

  // Get headers with auth token
  private getAuthHeaders(): HttpHeaders {
    // Ensure we never pass null to the Authorization header
    const username = localStorage.getItem('username') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'authToken': `${this.authToken || ''}`, // Use empty string as fallback
      'username': username
    });
  }

  /**
   * Predict sentiment from a single text input
   * @param text Text to analyze
   * @returns Observable with prediction result
   */
  predictText(text: string): Observable<PredictionResponse> {
    if (this.useMockData) {
      return of(mockPredictText(text));
    }
    
    const endpoint = `${this.apiUrl}/predict`;
    const payload = { text };
    return this.http.post<PredictionResponse>(endpoint, payload, { headers: this.getAuthHeaders() });
  }

  /**
   * Upload and process a CSV file for bulk prediction
   * @param file CSV file to process
   * @returns Observable with file ID for tracking
   */
  uploadCsvForPrediction(file: File): Observable<{ fileId: string, name: string, timestamp: Date }> {
    if (this.useMockData) {
      return mockUploadCsvFile(file);
    }
    
    const endpoint = `${this.apiUrl}/bulk_predict`;
    const formData = new FormData();
    formData.append('file', file);
    
    // Create headers without Content-Type (browser will set it for FormData)
    const username = localStorage.getItem('username') || '';
    const headers = new HttpHeaders({
      'authToken': `${this.authToken || ''}`,
      'username': username
      // Don't set Content-Type - let browser set it automatically for FormData
    });
    
    return this.http.post<any>(endpoint, formData, { headers }).pipe(
      catchError(this.handleError)
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
   * Get paginated file data
   * @param fileId ID of the file to retrieve
   * @param page Page number (0-based)
   * @param pageSize Number of items per page
   * @returns Observable with paginated file data
   */
  getFileDataPaginated(fileId: string, page: number, pageSize: number): Observable<any> {
    if (this.useMockData) {
      return mockGetFileDataPaginated(fileId, page, pageSize);
    }
    
    const endpoint = `${this.apiUrl}/files/${fileId}/data?page=${page}&pageSize=${pageSize}`;
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
  getUserData(userId: string): Observable<{ predictionHistory: any[], pendingFiles: any[], completedFiles: any[] }> {
    if (this.useMockData) {
      return mockGetUserData();
    }
    
    const endpoint = `${this.apiUrl}/user-data/${userId}`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        // Transform the API response to match frontend expectations
        const transformedResponse = {
          predictionHistory: this.transformPredictionHistory(response.prediction_history?.predictions || []),
          pendingFiles: response.pending_files?.files || [],
          completedFiles: response.completed_files?.files || []
        };
        
        console.log('Transformed getUserData response:', transformedResponse);
        return transformedResponse;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Transform prediction history from API format to frontend format
   * @param predictions Array of predictions from API
   * @returns Transformed predictions array
   */
  private transformPredictionHistory(predictions: any[]): any[] {
    return predictions.map(prediction => {
      // Convert sentiment scores from decimal to percentage and normalize names
      const transformedSentimentScores = prediction.sentiment_scores?.map((score: any) => ({
        name: score.name.toLowerCase() === 'neutral' ? 'Neutral' : score.name,
        value: score.value <= 1 ? Number((score.value * 100).toFixed(2)) : score.value
      })) || [];

      // Convert confidence from decimal to percentage
      let confidence = prediction.confidence || 0;
      if (confidence <= 1) {
        confidence = Number((confidence * 100).toFixed(2));
      }

      return {
        text: prediction.text,
        final_prediction: prediction.final_prediction,
        confidence: confidence,
        sentiment_scores: transformedSentimentScores,
        timestamp: new Date(prediction.timestamp || Date.now())
      };
    });
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

  /**
   * Get user's prediction history from the API
   * @param userId User ID to fetch history for
   * @returns Observable with prediction history
   */
  getPredictionHistory(userId: string): Observable<any> {
    if (this.useMockData) {
      // Use the existing mock data function
      return mockGetUserData().pipe(
        map(userData => ({
          user_id: userId,
          predictions: userData.predictionHistory || [],
          total_predictions: userData.predictionHistory?.length || 0
        })),
        delay(500)
      );
    }
    
    const endpoint = `${this.apiUrl}/prediction-history/${userId}`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        // Transform the prediction history response
        const transformedPredictions = this.transformPredictionHistory(response.predictions || []);
        
        return {
          user_id: response.user_id,
          predictions: transformedPredictions,
          total_predictions: response.total_predictions || transformedPredictions.length
        };
      }),
      catchError(this.handleError)
    );
  }

  downloadFile(fileId: string): Observable<any> {
    if (this.useMockData) {
      return of({ success: true, message: 'File downloaded successfully' }).pipe(delay(800));
    }

    const endpoint = `${this.apiUrl}/files/${fileId}/download`;
    return this.http.get(endpoint, { responseType: 'blob', headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        // Handle successful download
        console.log('File downloaded successfully:', response);
      }),
      catchError(this.handleError)
    );
  }

}
