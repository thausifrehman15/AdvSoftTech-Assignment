import { ChartData } from "chart.js";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
  message?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface PredictionRequest {
  text: string;
}


export interface PredictionResponse {
  text: string;
  confidence: number;
  final_prediction?: string;
  sentiment_scores?: {name:string,value:number}[];  
  timestamp?: Date;
}

export interface FileUploadResponse {
  fileId: string;
  name: string;
  status: string;
  message?: string;
  timestamp: Date;
}

export interface FileListItem {
  id: string;
  name: string;
  data: any[];
  chartData?: ChartData;
  isDefault?: boolean;
  status: string;
  timestamp: Date; 
}

// Make the data property optional in CompletedFile
export interface CompletedFile {
  id: string;
  name: string;
  status: string;
  timestamp: Date;
  data?: PredictionResponse[]; // Use PredictionResponse for data
}

// Use FileListItem for completedFiles since your mock data matches that structure
export interface FileListResponse {
  pendingFiles: Array<{
    id: string;
    name: string;
    timestamp: string;
  }>;
  completedFiles: Array<{
    id: string;
    name: string;
    status: string;
    timestamp: string;
    data?: PredictionResponse[];
  }>;
  count: number;
}

export interface FileDetailResponse {
  id: string;
  name: string;
  status: string;
  timestamp: Date;
  uploadedAt?: string;
  data?: PredictionResponse[]; // Use PredictionResponse for data
}

export interface FileStatusResponse {
  id: string;
  status: string;
  progress?: number;
  message?: string;
}

// Update the UserDataResponse to match your mock data structure
export interface UserDataResponse {
  username: string;
  email: string;
  totalPredictions: number;
  totalFiles: number;
  predictionHistory: Array<{
    text: string;
    final_prediction: string;
    confidence: number;
    sentiment_scores: { name: string; value: number; }[];
    timestamp: string;
  }>;
  pendingFiles: Array<{
    id: string;
    name: string;
    timestamp: string;
  }>;
  completedFiles: Array<{
    id: string;
    name: string;
    status: string;
    timestamp: string;
    data?: PredictionResponse[];
  }>;
}

// Add additional interfaces if needed...
