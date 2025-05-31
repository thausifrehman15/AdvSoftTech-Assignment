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


export interface FileUploadResponse {
  fileId: string;
  name: string;
  status: string;
  message?: string;
  timestamp: Date;
}

export interface FileDetailResponse {
  id: string;
  name: string;
  timestamp: Date;
  data?: PredictionHistoryResponse[];
}

export interface FilesResponse {
  id: string;
  name: string;
  timestamp: Date;
}
export interface PredictionHistoryResponse {
  text: string;
  final_prediction: string;
  confidence: number;
  sentiment_scores: { name: string; value: number; }[];
  timestamp: Date;
}

// Update the UserDataResponse to match your mock data structure
export interface UserDataResponse {
  username: string;
  email: string;
  totalPredictions: number;
  totalFiles: number;
  predictionHistory: PredictionHistoryResponse[];
  pendingFiles: FilesResponse[];
  completedFiles: FilesResponse[];
}

export interface FilesResponseWithChart extends FilesResponse {
  chartData?: ChartData;
  data: any[]; // Raw prediction data
}

export interface UserDataResponseWithChart {
  username: string;
  email: string;
  totalPredictions: number;
  totalFiles: number;
  predictionHistory: PredictionHistoryResponse[];
  pendingFiles: FilesResponse[];
  completedFiles: FilesResponseWithChart[]; // Use the new interface
}