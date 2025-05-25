import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../environment/environment';
import { addPredictionToHistory, mockCheckFileStatus, mockGetFileDetails, mockGetFiles, mockGetUserData, mockPredictText, mockUploadCsvFile } from './datafiles';
import { CheckSubscriptionResponse } from './check-subscription-response.interface';
import { LoginResponse } from './login-response.interface';
import { RegisterResponse, PredictionResponse } from './prediction.interface';
import { NotifyResponse } from './notify-response.interface'; // Assuming it's in the same folder


@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private apiUrl = environment.apiUrl || 'https://api.yourdomain.com';
  private useMockData = false;
  private authToken: string | null = null;
  static BULK_PREDICT_ENDPOINT: any;

  constructor(private http: HttpClient) {
    // Check for saved token in local storage
    this.authToken = localStorage.getItem('authToken');
  }

  // Inside the PredictionService class
// ...



// Helper to get the current username (you might need to adapt this)
getCurrentUsername(): string | null {
  const token = this.authToken; // Assumes this.authToken is loaded in constructor or by login
  if (token) {
      try {
          // Simple (and insecure for validation) JWT payload decoding:
          // This decodes the payload part (middle part) of a JWT.
          // A proper JWT library (like jwt-decode) is better for robust decoding.
          // The 'sub' claim is standard for the subject/identity.
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payloadBase64));
          console.log("Service getCurrentUsername: Decoded JWT payload:", decodedPayload);
          return decodedPayload.sub; // 'sub' usually holds the username/identity
      } catch (e) {
          console.error("Service getCurrentUsername: Error decoding token, or token invalid:", e);
          // Fallback or if username was stored separately:
          // return localStorage.getItem('loggedInUsername'); 
          return null;
      }
  }
  // Fallback if no token
  // return localStorage.getItem('loggedInUsername'); 
  return null;
}

  // Authentication methods
  login(username: string, password: string): Observable<LoginResponse> {
    const endpoint = `${this.apiUrl}/login`;
    console.log('API URL:', endpoint); // Log the API URL
    console.log('Login payload:', { username, password }); // Log the payload
    return this.http.post<LoginResponse>(endpoint, { username, password }).pipe(
      tap(response => {
        console.log('Login response:', response); // Log the full response
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); // Save token to local storage
          console.log('Token saved:', response.token);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error('Login failed. Please try again.'));
      })
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

  //changed the 
  isLoggedIn(): boolean {
    this.authToken = localStorage.getItem('authToken'); // Ensure it's fresh
    const loggedIn = !!this.authToken;
    console.log(`Service ISLOGGEDIN: authToken from localStorage: '${this.authToken}', Result: ${loggedIn}`);
    return loggedIn;
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
    return of({ success: true, message: 'User registered successfully (mock)' }).pipe(delay(500));
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
 * Calls the /notify GET endpoint on the backend.
 * This endpoint is expected to log a message on the server and return a confirmation.
 * @returns Observable<NotifyResponse> containing the server's message.
 */
triggerServerNotification(): Observable<NotifyResponse> {
  // Check if mock data should be used (consistent with your other methods)
  if (this.useMockData) {
    console.warn('MOCK: Triggering server notification (via triggerServerNotification).');
    // Return a mock response that matches the NotifyResponse interface
    return of({ message: 'Mock: Server notification triggered successfully.' } as NotifyResponse).pipe(delay(300));
  }

  const endpoint = `${this.apiUrl}/notify`; // apiUrl should be 'http://127.0.0.1:5000'
  
  console.log(`Service: Calling GET ${endpoint}`);

  // Make the GET request, expecting a response that matches the NotifyResponse interface
  return this.http.get<NotifyResponse>(endpoint).pipe(
    tap((response: NotifyResponse) => {
      console.log('Service: /notify API call successful. Response:', response);
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Service: /notify API call error:', error);
      
      let displayMessage = 'Failed to trigger server notification.';
      // Attempt to parse error.error if it exists and might contain a specific message
      if (error.error) {
        if (typeof error.error.message === 'string') { // If backend error is {message: "..."}
            displayMessage = error.error.message;
        } else if (typeof error.error.error === 'string') { // If backend error is {error: "..."}
            displayMessage = error.error.error;
        } else if (typeof error.error === 'string') { // If error.error itself is the message string
            displayMessage = error.error;
        }
      } else if (error.message) { // General HttpErrorResponse message
          displayMessage = error.message;
      }
      
      // Using throwError to propagate a new Error object with a user-friendly message
      return throwError(() => new Error(displayMessage)); 
    })
  );
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

  // Inside the PredictionService class
// ... (constructor, login, register, logout, isLoggedIn, mock methods, etc.) ...

/**
 * Checks the subscription status of the currently logged-in user.
 * @returns Observable<CheckSubscriptionResponse>
 */
checkCurrentUserSubscription(): Observable<CheckSubscriptionResponse> {
  const username = this.getCurrentUsername();

  if (!username) {
      console.error("Service checkCurrentUserSubscription: Username not available. Cannot check subscription.");
      // Return an observable that errors or emits a default "not subscribed" state
      return throwError(() => new Error("User not logged in or username unavailable for subscription check."));
      // Or: return of({ access: false, message: "User not identified." } as CheckSubscriptionResponse);
  }

  if (this.useMockData) {
      console.warn(`MOCK: Checking subscription for user: ${username}`);
      // Example mock logic
      if (["usman", "arpan", "thausif"].includes(username)) { // Based on your subscriptions.json
          return of({ access: true, message: "Mock: You are subscribed!" } as CheckSubscriptionResponse).pipe(delay(300));
      } else {
          return of({ access: false, message: "Mock: Please subscribe to access this feature." } as CheckSubscriptionResponse).pipe(delay(300));
      }
  }

  const endpoint = `${this.apiUrl}/check-subscription`;
  // Create HttpParams to send username as a URL query parameter
  const params = new HttpParams().set('username', username);

  console.log(`Service: Calling GET ${endpoint} with params:`, params.toString());

  // Make the GET request
  // This endpoint, as per your main.py, doesn't strictly require JWT auth if it's just looking up by username.
  // However, if you want to ensure only a logged-in user can check *their own* status,
  // the backend could validate that the JWT identity matches the username param.
  // For now, assuming it works as defined in main.py (no explicit JWT protection on /check-subscription itself).
  return this.http.get<CheckSubscriptionResponse>(endpoint, { params }).pipe(
      tap((response: CheckSubscriptionResponse) => {
          console.log('Service: /check-subscription API call successful. Response:', response);
      }),
      catchError((error: HttpErrorResponse) => {
          console.error('Service: /check-subscription API call error:', error);
          let displayMessage = 'Failed to check subscription status.';
          if (error.error && (typeof error.error.message === 'string' || typeof error.error.error === 'string')) {
              displayMessage = error.error.message || error.error.error;
          } else if (error.message) {
              displayMessage = error.message;
          }
          // return this.handleError(error); // If your generic handleError is suitable
          return throwError(() => new Error(displayMessage));
      })
  );
}

// ... (rest of your service: predictText, uploadCsvForPrediction, etc.) ...

  uploadCsvForPrediction(file: File, username: string, email: string): Observable<Blob> {
    const endpoint = `${this.apiUrl}/bulk_predict`;
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('username', username);
    formData.append('email', email);

    console.log('Form data being sent:', {
      file: file.name,
      username: username,
      email: email,
    }); // Debug log

    return this.http.post(endpoint, formData, { responseType: 'blob' }).pipe(
      tap(() => console.log('CSV upload successful')),
      catchError((error: HttpErrorResponse) => {
        console.error('Error uploading CSV:', error);
        return throwError(() => new Error('Failed to upload CSV file.'));
      })
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