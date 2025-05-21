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

@Injectable({
  providedIn: 'root'
})
export class PredictionService {
  private static readonly BULK_PREDICT_ENDPOINT = '/bulk_predict'; // Static constant for the endpoint
  private apiUrl = environment.apiUrl || 'https://api.yourdomain.com';
  private useMockData = false; // Set to false to use real API

  constructor(private http: HttpClient) { }

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
    return this.http.get<any>(endpoint);
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
    return this.http.get<any>(endpoint);
  }

  /**
   * Check status of a pending file
   * @param fileId ID of the file to check
   * @returns Observable with current status
   */
  checkFileStatus(fileId: string): Observable<{ status: string, progress?: number }> {
    if (this.useMockData) {
      return mockCheckFileStatus(fileId);
    }
    
    const endpoint = `${this.apiUrl}/files/${fileId}/status`;
    return this.http.get<any>(endpoint);
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
    return this.http.get<any>(endpoint);
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