import { ChartData } from 'chart.js';
import { PredictionResponse } from './prediction.interface';

export interface CsvFile {
  id: string;
  name: string;
  data: PredictionResponse[];
  chartData?: ChartData;
  isDefault?: boolean;
  status: string;
  timestamp: string; // Changed from Date to string
}

export interface PredictionHistoryItem {
  text: string;
  result: string;
  confidence: number;
  categories: Array<{
    name: string;
    value: number;
  }>;
  timestamp: string; // Changed from Date to string
}

export interface SinglePrediction {
  text: string;
  result: string;
  confidence: number;
  categories: Array<{
    name: string;
    value: number;
  }>;
  timestamp: string; // Changed from Date to string
}

export interface PendingFile {
  id: string;
  name: string;
  timestamp: string; // Changed from Date to string
}
