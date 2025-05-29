import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { addPredictionToHistory, mockCheckFileStatus, mockGetFileDataPaginated, mockGetFileDetails, mockGetFiles, mockGetUserData, mockPredictText, mockUploadCsvFile } from './datafiles';
import { FilesResponse, PredictionHistoryResponse, UserDataResponse, UserDataResponseWithChart } from './prediction.interface';
import { ChartData } from 'chart.js';

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
  predictText(text: string): Observable<PredictionHistoryResponse> {
    if (this.useMockData) {
      return of(mockPredictText(text));
    }
    
    const endpoint = `${this.apiUrl}/predict`;
    const payload = { text };
    return this.http.post<PredictionHistoryResponse>(endpoint, payload, { headers: this.getAuthHeaders() });
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
  getFiles(): Observable<{ pendingFiles: FilesResponse[], completedFiles: FilesResponse[] }> {
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
  getFileDetails(userId:string, fileId: string): Observable<any> {
    if (this.useMockData) {
      return mockGetFileDetails(fileId);
    }
    
    const endpoint = `${this.apiUrl}/files/${userId}/${fileId}`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() });
  }

  /**
   * Get user data including prediction history and files
   * @returns Observable with user data
   */
  /**
   * Get user data including prediction history and files
   * @returns Observable with user data
   */
  getUserData(userId: string): Observable<UserDataResponseWithChart> {
    if (this.useMockData) {
      return mockGetUserData().pipe(
        map(mockData => ({
          username: 'testuser',
          email: 'test@example.com',
          totalPredictions: mockData.predictionHistory?.length || 0,
          totalFiles: mockData.completedFiles?.length || 0,
          predictionHistory: mockData.predictionHistory || [],
          pendingFiles: mockData.pendingFiles || [],
          completedFiles: (mockData.completedFiles || []).map(file => ({
            ...file,
            chartData: this.generateChartDataFromFile(file.data || []),
            data: file.data || []
          }))
        })),
        delay(500)
      );
    }
    
    const endpoint = `${this.apiUrl}/user-data/${userId}`;
    return this.http.get<any>(endpoint, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        // Transform the API response to match UserDataResponseWithChart interface
        const transformedResponse: UserDataResponseWithChart = {
          username: localStorage.getItem('username') || 'Unknown',
          email: 'user@example.com',
          totalPredictions: response.prediction_history?.total_predictions || 0,
          totalFiles: response.completed_files?.total || 0,
          predictionHistory: this.transformPredictionHistory(response.prediction_history?.predictions || []),
          pendingFiles: (response.pending_files?.files || []).map((file: any) => ({
            id: file.file_id || file.id,
            name: file.filename?.replace('_pending.csv', '.csv') || file.name,
            timestamp: file.submitted_at || file.timestamp,
            progress: file.progress || 0,
            status: file.status || 'pending'
          })),
          completedFiles: (response.completed_files?.files || []).map((file: any) => {
            const fileData = file.sample_predictions || [];
            return {
              id: file.file_id || file.id,
              name: file.filename?.replace('_completed.csv', '.csv') || file.name,
              timestamp: file.completed_at || file.timestamp,
              status: file.status || 'completed',
              data: fileData,
              chartData: this.generateChartDataFromFile(fileData)
            };
          })
        };
        
        console.log('Transformed getUserData response:', transformedResponse);
        return transformedResponse;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Generate chart data from file prediction data
   * @param fileData Array of prediction results
   * @returns ChartData for radar/pie charts
   */
  private generateChartDataFromFile(fileData: any[]): ChartData {
    if (!fileData || fileData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'No Data Available',
          data: [],
          backgroundColor: []
        }]
      };
    }

    // Aggregate sentiment scores across all predictions
    const sentimentTotals: { [key: string]: number } = {};
    const sentimentCounts: { [key: string]: number } = {};

    fileData.forEach(prediction => {
      if (prediction.sentiment_scores) {
        prediction.sentiment_scores.forEach((score: any) => {
          const name = score.name;
          if (!sentimentTotals[name]) {
            sentimentTotals[name] = 0;
            sentimentCounts[name] = 0;
          }
          sentimentTotals[name] += score.value || 0;
          sentimentCounts[name]++;
        });
      }
    });

    // Calculate averages
    const labels: string[] = [];
    const data: number[] = [];
    const colors = [
      'rgba(220, 53, 69, 0.8)',   // Negative/Very Negative - red
      'rgba(255, 193, 7, 0.8)',   // Slightly Negative - amber
      'rgba(108, 117, 125, 0.8)', // Neutral - gray
      'rgba(13, 202, 240, 0.8)',  // Slightly Positive - info blue
      'rgba(25, 135, 84, 0.8)',   // Positive/Very Positive - green
    ];

    // Define the order of sentiment categories
    const sentimentOrder = ['Negative', 'Very Negative', 'Slightly Negative', 'Neutral', 'Slightly Positive', 'Positive', 'Very Positive'];
    
    sentimentOrder.forEach(sentiment => {
      if (sentimentTotals[sentiment] && sentimentCounts[sentiment]) {
        labels.push(sentiment);
        data.push(Number((sentimentTotals[sentiment] / sentimentCounts[sentiment]).toFixed(2)));
      }
    });

    return {
      labels,
      datasets: [{
        label: 'Average Sentiment Distribution',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: 'rgba(179,181,198,1)',
        borderWidth: 1
      }]
    };
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

  /**
   * Download a single file
   * @param userId User ID
   * @param fileId File ID to download
   * @returns Observable with blob response
   */
  downloadFile(userId: string, fileId: string): Observable<Blob> {
    if (this.useMockData) {
      return of(new Blob(['mock,data\n1,test'], { type: 'text/csv' })).pipe(delay(800));
    }

    console.log('Downloading file via API:', { userId, fileId });

    // Try the main download endpoint first
    const endpoint = `${this.apiUrl}/files/${userId}/${fileId}/download`;
    
    return this.http.get(endpoint, { 
      responseType: 'blob', 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('Download error:', error);
        
        // If it's a 404, try alternative endpoint
        if (error.status === 404) {
          console.log('Trying alternative download endpoint...');
          const altEndpoint = `${this.apiUrl}/download/${userId}/${fileId}`;
          
          return this.http.get(altEndpoint, { 
            responseType: 'blob', 
            headers: this.getAuthHeaders() 
          }).pipe(
            catchError(this.handleError)
          );
        }
        
        return this.handleError(error);
      })
    );
  }

}
