import { ChartData } from 'chart.js';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PredictionResponse } from './prediction.interface';

/**
 * Sample prediction history data for single prediction view
 */
export const SAMPLE_PREDICTION_HISTORY = [
  {
    text: 'Great customer service experience with your team today!',
    final_prediction: 'Very Positive',
    confidence: 45,
    sentiment_scores: [
      { name: 'Very Negative', value: 5 },
      { name: 'Slightly Negative', value: 7 },
      { name: 'Neutral', value: 13 },
      { name: 'Slightly Positive', value: 30 },
      { name: 'Very Positive', value: 45 },
    ],
    timestamp: new Date('2025-05-20T17:13:00'),
  },
  {
    text: 'Product arrived damaged and missing parts.',
    final_prediction: 'Very Negative',
    confidence: 42,
    sentiment_scores: [
      { name: 'Very Negative', value: 42 },
      { name: 'Slightly Negative', value: 28 },
      { name: 'Neutral', value: 15 },
      { name: 'Slightly Positive', value: 10 },
      { name: 'Very Positive', value: 5 },
    ],
    timestamp: new Date('2025-05-20T16:13:00'),
  },
  {
    text: 'The documentation was clear and helpful.',
    final_prediction: 'Slightly Positive',
    confidence: 38,
    sentiment_scores: [
      { name: 'Very Negative', value: 8 },
      { name: 'Slightly Negative', value: 12 },
      { name: 'Neutral', value: 20 },
      { name: 'Slightly Positive', value: 38 },
      { name: 'Very Positive', value: 22 },
    ],
    timestamp: new Date('2025-05-20T15:13:00'),
  },
  {
    text: 'Waiting for my refund for over 2 weeks now.',
    final_prediction: 'Slightly Negative',
    confidence: 35,
    sentiment_scores: [
      { name: 'Very Negative', value: 25 },
      { name: 'Slightly Negative', value: 35 },
      { name: 'Neutral', value: 20 },
      { name: 'Slightly Positive', value: 15 },
      { name: 'Very Positive', value: 5 },
    ],
    timestamp: new Date('2025-05-20T14:13:00'),
  },
  {
    text: 'Neutral review, does what it says.',
    final_prediction: 'Neutral',
    confidence: 40,
    sentiment_scores: [
      { name: 'Very Negative', value: 12 },
      { name: 'Slightly Negative', value: 18 },
      { name: 'Neutral', value: 40 },
      { name: 'Slightly Positive', value: 20 },
      { name: 'Very Positive', value: 10 },
    ],
    timestamp: new Date('2025-05-20T13:13:00'),
  },
  {
    text: 'The product exceeded my expectations in every way.',
    final_prediction: 'Very Positive',
    confidence: 45,
    sentiment_scores: [
      { name: 'Very Negative', value: 5 },
      { name: 'Slightly Negative', value: 7 },
      { name: 'Neutral', value: 13 },
      { name: 'Slightly Positive', value: 30 },
      { name: 'Very Positive', value: 45 },
    ],
    timestamp: new Date('2025-05-20T12:13:00'),
  },
  {
    text: 'This was a complete waste of money.',
    final_prediction: 'Very Negative',
    confidence: 42,
    sentiment_scores: [
      { name: 'Very Negative', value: 42 },
      { name: 'Slightly Negative', value: 28 },
      { name: 'Neutral', value: 15 },
      { name: 'Slightly Positive', value: 10 },
      { name: 'Very Positive', value: 5 },
    ],
    timestamp: new Date('2025-05-20T11:13:00'),
  },
  {
    text: 'Average product, nothing special but works fine.',
    final_prediction: 'Slightly Positive',
    confidence: 38,
    sentiment_scores: [
      { name: 'Very Negative', value: 8 },
      { name: 'Slightly Negative', value: 12 },
      { name: 'Neutral', value: 20 },
      { name: 'Slightly Positive', value: 38 },
      { name: 'Very Positive', value: 22 },
    ],
    timestamp: new Date('2025-05-20T10:13:00'),
  },
  {
    text: 'The customer support team was very responsive.',
    final_prediction: 'Slightly Negative',
    confidence: 35,
    sentiment_scores: [
      { name: 'Very Negative', value: 25 },
      { name: 'Slightly Negative', value: 35 },
      { name: 'Neutral', value: 20 },
      { name: 'Slightly Positive', value: 15 },
      { name: 'Very Positive', value: 5 },
    ],
    timestamp: new Date('2025-05-20T09:13:00'),
  },
  {
    text: 'Software is buggy and crashes frequently.',
    final_prediction: 'Neutral',
    confidence: 40,
    sentiment_scores: [
      { name: 'Very Negative', value: 12 },
      { name: 'Slightly Negative', value: 18 },
      { name: 'Neutral', value: 40 },
      { name: 'Slightly Positive', value: 20 },
      { name: 'Very Positive', value: 10 },
    ],
    timestamp: new Date('2025-05-20T08:13:00'),
  },
  {
    text: 'Thank you for the prompt delivery!',
    final_prediction: 'Very Positive',
    confidence: 45,
    sentiment_scores: [
      { name: 'Very Negative', value: 5 },
      { name: 'Slightly Negative', value: 7 },
      { name: 'Neutral', value: 13 },
      { name: 'Slightly Positive', value: 30 },
      { name: 'Very Positive', value: 45 },
    ],
    timestamp: new Date('2025-05-20T07:13:00'),
  },
  {
    text: 'Will definitely recommend to my friends.',
    final_prediction: 'Very Negative',
    confidence: 42,
    sentiment_scores: [
      { name: 'Very Negative', value: 42 },
      { name: 'Slightly Negative', value: 28 },
      { name: 'Neutral', value: 15 },
      { name: 'Slightly Positive', value: 10 },
      { name: 'Very Positive', value: 5 },
    ],
    timestamp: new Date('2025-05-20T06:13:00'),
  },
  {
    text: 'Not what I expected based on the description.',
    final_prediction: 'Slightly Positive',
    confidence: 38,
    sentiment_scores: [
      { name: 'Very Negative', value: 8 },
      { name: 'Slightly Negative', value: 12 },
      { name: 'Neutral', value: 20 },
      { name: 'Slightly Positive', value: 38 },
      { name: 'Very Positive', value: 22 },
    ],
    timestamp: new Date('2025-05-20T05:13:00'),
  },
];

/**
 * Sample CSV files for bulk prediction view
 */
export const SAMPLE_CSV_FILES = [
  {
    id: 'csv1',
    name: 'Customer Feedback',
    isDefault: false,
    data: [
      {
        text: "The service was exceptional and I'm very satisfied.",
        final_prediction: 'Very Positive',
        confidence: 85,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 3 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 4 },
          { name: 'Slightly Positive', value: 6 },
          { name: 'Very Positive', value: 85 },
        ],
      },
      {
        text: "Staff was rude and the product didn't work at all.",
        final_prediction: 'Very Negative',
        confidence: 72,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 72 },
          { name: 'Slightly Negative', value: 18 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        text: 'It functions as expected, no issues so far.',
        final_prediction: 'Neutral',
        confidence: 65,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 8 },
          { name: 'Neutral', value: 65 },
          { name: 'Slightly Positive', value: 15 },
          { name: 'Very Positive', value: 7 },
        ],
      },
      {
        text: 'The online experience could be improved.',
        final_prediction: 'Slightly Negative',
        confidence: 55,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 15 },
          { name: 'Slightly Negative', value: 55 },
          { name: 'Neutral', value: 20 },
          { name: 'Slightly Positive', value: 7 },
          { name: 'Very Positive', value: 3 },
        ],
      },
      {
        text: "I'm mostly happy with my purchase.",
        final_prediction: 'Slightly Positive',
        confidence: 68,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 7 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 68 },
          { name: 'Very Positive', value: 10 },
        ],
      },
      {
        text: 'Product is amazing but delivery was slow.',
        final_prediction: 'Slightly Positive',
        confidence: 62,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 8 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 62 },
          { name: 'Very Positive', value: 10 },
        ],
      },
      {
        text: 'I returned the item immediately.',
        final_prediction: 'Slightly Negative',
        confidence: 58,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 25 },
          { name: 'Slightly Negative', value: 58 },
          { name: 'Neutral', value: 12 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        text: "It's ok I guess, nothing special.",
        final_prediction: 'Neutral',
        confidence: 70,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 10 },
          { name: 'Neutral', value: 70 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 5 },
        ],
      },
      {
        text: 'Great value for money, highly recommended!',
        final_prediction: 'Very Positive',
        confidence: 80,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 3 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 80 },
        ],
      },
      {
        text: 'The website crashed during checkout.',
        final_prediction: 'Very Negative',
        confidence: 75,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 75 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      // Add more rows to demonstrate pagination
      {
        text: 'Not worth the price I paid.',
        final_prediction: 'Slightly Negative',
        confidence: 60,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 25 },
          { name: 'Slightly Negative', value: 60 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        text: 'The shipping was incredibly fast!',
        final_prediction: 'Very Positive',
        confidence: 78,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 5 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 78 },
        ],
      },
    ],
    status: 'completed',
    timestamp: new Date('2025-05-18T14:30:00'),
    chartData: generateChartData('Customer Feedback'),
  },
  {
    id: 'csv2',
    name: 'Product Reviews',
    isDefault: false,
    data: [
      {
        text: 'This product changed my life!',
        final_prediction: 'Very Positive',
        confidence: 88,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 3 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 88 },
        ],
      },
      {
        text: 'It broke after two days of use.',
        final_prediction: 'Very Negative',
        confidence: 76,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 76 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 2 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        text: 'Works as described, average performance.',
        final_prediction: 'Neutral',
        confidence: 65,
        timestamp: new Date('2025-05-18T15:00:00'),
        sentiment_scores: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 10 },
          { name: 'Neutral', value: 65 },
          { name: 'Slightly Positive', value: 15 },
          { name: 'Very Positive', value: 5 },
        ],
      },
    ],
    status: 'completed',
    timestamp: new Date('2025-05-19T09:45:00'),
    chartData: generateChartData('Product Reviews'),
  },
];

/**
 * Sample pending files
 */
export const SAMPLE_PENDING_FILES = [
  {
    id: 'pending1',
    name: 'large_dataset_processing.csv',
    timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
  },
  {
    id: 'pending2',
    name: 'financial_predictions_2025.csv',
    timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
  },
];

/**
 * Sample "My Files" for file management
 */
export const SAMPLE_MY_FILES = [
  {
    id: 'my1',
    name: 'customer_segmentation.csv',
    status: 'completed',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000),
    isDefault: false,
    data: [
      {
        text: 'I love your products and will keep buying them!',
        final_prediction: 'Very Positive',
        confidence: 90,
        sentiment_scores: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 1 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 90 },
        ],
        timestamp: new Date(),
      },
      {
        text: 'Service was average, could be improved.',
        final_prediction: 'Neutral',
        confidence: 62,
        sentiment_scores: [
          { name: 'Very Negative', value: 8 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 62 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 5 },
        ],
        timestamp: new Date(),
      },
      {
        text: 'I was very disappointed with my experience.',
        final_prediction: 'Slightly Negative',
        confidence: 68,
        sentiment_scores: [
          { name: 'Very Negative', value: 20 },
          { name: 'Slightly Negative', value: 68 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 2 },
        ],
        timestamp: new Date(),
      },
    ],
    chartData: generateChartData('Customer Segmentation'),
  },
  {
    id: 'my2',
    name: 'marketing_campaign_results.csv',
    status: 'completed',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
    isDefault: false,
    data: [
      {
        text: 'Your promotional email was very informative.',
        final_prediction: 'Slightly Positive',
        confidence: 72,
        sentiment_scores: [
          { name: 'Very Negative', value: 3 },
          { name: 'Slightly Negative', value: 5 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 72 },
          { name: 'Very Positive', value: 10 },
        ],
        timestamp: new Date(),
      },
      {
        text: 'I find these marketing emails annoying.',
        final_prediction: 'Slightly Negative',
        confidence: 65,
        sentiment_scores: [
          { name: 'Very Negative', value: 20 },
          { name: 'Slightly Negative', value: 65 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
        timestamp: new Date(),
      },
    ],
    chartData: generateChartData('Marketing Campaign Results'),
  },
];

/**
 * Helper function to generate chart data for a sample dataset
 */
function generateChartData(datasetName: string): ChartData {
  // This would normally be generated from the actual data
  // Here we're just creating dummy chart data
  return {
    labels: [
      'Very Negative',
      'Slightly Negative',
      'Neutral',
      'Slightly Positive',
      'Very Positive',
    ],
    datasets: [
      {
        label: datasetName + ' Sentiment Analysis',
        backgroundColor: [
          'rgba(220, 53, 69, 0.8)', // Very Negative - red
          'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
          'rgba(108, 117, 125, 0.8)', // Neutral - gray
          'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
          'rgba(25, 135, 84, 0.8)', // Very Positive - green
        ],
        borderColor: 'rgba(179,181,198,1)',
        data: [
          Math.floor(Math.random() * 20 + 5), // Very Negative
          Math.floor(Math.random() * 25 + 10), // Slightly Negative
          Math.floor(Math.random() * 30 + 15), // Neutral
          Math.floor(Math.random() * 35 + 10), // Slightly Positive
          Math.floor(Math.random() * 25 + 10), // Very Positive
        ],
      },
    ],
  };
}

let userPredictionHistory = [...SAMPLE_PREDICTION_HISTORY];
let pendingFiles = [...SAMPLE_PENDING_FILES];
let completedFiles = [...SAMPLE_MY_FILES];
let csvFilesData = [...SAMPLE_CSV_FILES];

/**
 * MOCK API FUNCTIONS
 * These functions simulate API endpoints
 */

/**
 * Mock API call to predict text sentiment
 * @param text Text to analyze
 * @returns Observable with prediction result
 */
export function mockPredictText(text: string): PredictionResponse {
  // Simulate API processing time
  // Generate random confidence value between 30 and 95
  const confidence = Math.floor(Math.random() * 65) + 30;
  
  // Get prediction category
  const final_prediction = getRandomPrediction();
  
  // Generate sentiment scores with highest value matching prediction
  const sentimentScores = [
    { name: 'Very Negative', value: Math.floor(Math.random() * 25) + 5 },
    { name: 'Slightly Negative', value: Math.floor(Math.random() * 25) + 5 },
    { name: 'Neutral', value: Math.floor(Math.random() * 25) + 5 },
    { name: 'Slightly Positive', value: Math.floor(Math.random() * 25) + 5 },
    { name: 'Very Positive', value: Math.floor(Math.random() * 25) + 5 },
  ];
  
  // Ensure the predicted category has the highest confidence
  const predictedCategoryIndex = sentimentScores.findIndex(
    (c) => c.name === final_prediction
  );
  if (predictedCategoryIndex >= 0) {
    sentimentScores[predictedCategoryIndex].value = confidence;
  }
  
  const prediction = {
    text: text,
    final_prediction: final_prediction,
    confidence: confidence,
    sentiment_scores: sentimentScores,
    timestamp: new Date()
  };
  
  // Add to prediction history
  addPredictionToHistory(prediction);
  
  return prediction;
}

/**
 * Mock API call to upload and process CSV file
 * @param file File to process
 * @returns Observable with file details
 */
export function mockUploadCsvFile(
  file: File
): Observable<{ fileId: string; name: string; timestamp: Date }> {
  // Generate a unique ID
  const fileId = 'file_' + Date.now();
  const timestamp = new Date();

  // Add to pending files
  const pendingFile = {
    id: fileId,
    name: file.name,
    timestamp: timestamp,
  };
  pendingFiles.push(pendingFile);

  // Schedule automatic completion after 8 seconds
  setTimeout(() => {
    // Find and remove the file from pending
    const pendingIndex = pendingFiles.findIndex((f) => f.id === fileId);
    if (pendingIndex !== -1) {
      pendingFiles.splice(pendingIndex, 1);

      // Create completed file with sample data
      const newCompletedFile = {
        id: fileId,
        name: file.name,
        status: 'completed' as 'completed' | 'pending' | 'error',
        timestamp: new Date(),
        isDefault: false,
        data: [
          {
            text: 'We love your customer service approach!',
            final_prediction: 'Very Positive',
            confidence: 92,
            sentiment_scores: [
              { name: 'Very Negative', value: 1 },
              { name: 'Slightly Negative', value: 2 },
              { name: 'Neutral', value: 1 },
              { name: 'Slightly Positive', value: 4 },
              { name: 'Very Positive', value: 92 },
            ],
            timestamp: new Date()
          },
          {
            text: 'The product is okay but delivery was slow.',
            final_prediction: 'Neutral',
            confidence: 68,
            sentiment_scores: [
              { name: 'Very Negative', value: 5 },
              { name: 'Slightly Negative', value: 12 },
              { name: 'Neutral', value: 68 },
              { name: 'Slightly Positive', value: 10 },
              { name: 'Very Positive', value: 5 },
            ],
            timestamp: new Date()
          },
          {
            text: 'I was disappointed with the quality.',
            final_prediction: 'Slightly Negative',
            confidence: 75,
            sentiment_scores: [
              { name: 'Very Negative', value: 15 },
              { name: 'Slightly Negative', value: 75 },
              { name: 'Neutral', value: 5 },
              { name: 'Slightly Positive', value: 3 },
              { name: 'Very Positive', value: 2 },
            ],
            timestamp: new Date()
          },
        ],
        chartData: {
          labels: [
            'Very Negative',
            'Slightly Negative',
            'Neutral',
            'Slightly Positive',
            'Very Positive',
          ],
          datasets: [
            {
              label: 'Sentiment Analysis Results',
              backgroundColor: [
                'rgba(220, 53, 69, 0.8)', // Very Negative - red
                'rgba(255, 193, 7, 0.8)', // Slightly Negative - amber
                'rgba(108, 117, 125, 0.8)', // Neutral - gray
                'rgba(13, 202, 240, 0.8)', // Slightly Positive - info blue
                'rgba(25, 135, 84, 0.8)', // Very Positive - green
              ],
              borderColor: 'rgba(179,181,198,1)',
              data: [7, 29, 25, 14, 31],
            },
          ],
        },
      };

      // Add to completed files
      completedFiles.push(newCompletedFile);

      // Add to CSV files data for visualization
      csvFilesData.push(newCompletedFile);
    }
  }, 8000); // Process after 8 seconds

  // Return the file details immediately
  return of({
    fileId: fileId,
    name: file.name,
    timestamp: timestamp,
  }).pipe(delay(800)); // Simulate upload delay
}

/**
 * Mock API call to get all files (pending and completed)
 * @returns Observable with file lists
 */
export function mockGetFiles(): Observable<{
  pendingFiles: any[];
  completedFiles: any[];
}> {
  return of({
    pendingFiles: pendingFiles,
    completedFiles: completedFiles,
  }).pipe(delay(600));
}

/**
 * Mock API call to get file details
 * @param fileId ID of the file to retrieve
 * @returns Observable with file data
 */
export function mockGetFileDetails(fileId: string): Observable<any> {
  // Check if file exists in CSV files
  const existingFile = csvFilesData.find((file) => file.id === fileId);
  if (existingFile) {
    return of(existingFile).pipe(delay(700));
  }

  // Check if file exists in completed files
  const completedFile = completedFiles.find((file) => file.id === fileId);
  if (completedFile) {
    return of(completedFile).pipe(delay(700));
  }

  // File not found
  return throwError(() => new Error('File not found'));
}

/**
 * Mock API call to check file processing status
 * @param fileId ID of file to check
 * @returns Observable with status information
 */
export function mockCheckFileStatus(
  fileId: string
): Observable<{ status: string; progress?: number }> {
  // Find if file is in pending
  const pendingIndex = pendingFiles.findIndex((file) => file.id === fileId);

  if (pendingIndex === -1) {
    // File not in pending - either completed or doesn't exist
    const completedFile = completedFiles.find((file) => file.id === fileId);
    if (completedFile) {
      return of({ status: 'completed' }).pipe(delay(300));
    }
    return of({ status: 'error', progress: 0 }).pipe(delay(300));
  }

  // File is still pending - calculate a progress percentage based on time elapsed
  // We know it will complete after 8 seconds
  const pendingFile = pendingFiles[pendingIndex];
  const timeElapsed = Date.now() - pendingFile.timestamp.getTime();
  const progressPercentage = Math.min(
    Math.floor((timeElapsed / 8000) * 100),
    99
  );

  return of({
    status: 'pending',
    progress: progressPercentage,
  }).pipe(delay(300));
}

/**
 * Mock API call to get user data including prediction history and files
 * @returns Observable with user data
 */
export function mockGetUserData(): Observable<{
  predictionHistory: any[];
  pendingFiles: any[];
  completedFiles: any[];
}> {
  return of({
    predictionHistory: userPredictionHistory,
    pendingFiles: pendingFiles,
    completedFiles: completedFiles,
  }).pipe(delay(800));
}

/**
 * Helper function to add a prediction to history
 * @param prediction Prediction to add
 */
export function addPredictionToHistory(prediction: any): void {
  // Check if this exact prediction is already in the history
  const isDuplicate = userPredictionHistory.some((p: any) => 
    p.text === prediction.text && 
    ((p.timestamp instanceof Date && prediction.timestamp instanceof Date && 
      p.timestamp.getTime() === prediction.timestamp.getTime()) ||
     (typeof p.timestamp === 'string' && typeof prediction.timestamp === 'string' &&
      p.timestamp === prediction.timestamp))
  );
  
  // Only add if not a duplicate
  if (!isDuplicate) {
    userPredictionHistory.unshift({
      text: prediction.text,
      final_prediction: prediction.final_prediction,
      confidence: prediction.confidence,
      sentiment_scores: prediction.sentiment_scores || [],
      timestamp: prediction.timestamp
    });
  }
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Generate random prediction category
 */
function getRandomPrediction(): string {
  const predictions = [
    'Very Positive',
    'Slightly Positive',
    'Neutral',
    'Slightly Negative',
    'Very Negative',
  ];
  return predictions[Math.floor(Math.random() * predictions.length)];
}

/**
 * Generate random sentiment scores
 */
function generateRandomSentimentScores(): Record<string, number> {
  // Generate base values that will sum to roughly 1
  const veryPositive = Math.random() * 0.3;
  const slightlyPositive = Math.random() * 0.3;
  const neutral = Math.random() * 0.2;
  const slightlyNegative = Math.random() * 0.2;
  const negative = Math.random() * 0.2;

  // Calculate total
  const total =
    veryPositive + slightlyPositive + neutral + slightlyNegative + negative;

  // Normalize to sum to 1
  return {
    'Very Positive': parseFloat((veryPositive / total).toFixed(4)),
    'Slightly Positive': parseFloat((slightlyPositive / total).toFixed(4)),
    Neutral: parseFloat((neutral / total).toFixed(4)),
    'Slightly Negative': parseFloat((slightlyNegative / total).toFixed(4)),
    Negative: parseFloat((negative / total).toFixed(4)),
  };
}

/**
 * Generate random file data with predictions
 * @param rowCount Number of rows to generate
 */
function generateRandomFileData(rowCount: number): any[] {
  const sampleTexts = [
    'The customer service was exceptional.',
    'I had a terrible experience with this product.',
    'It was okay, nothing special.',
    "I can't believe how amazing this is!",
    "This doesn't work as advertised.",
    'Average product, does what it says.',
    'Slightly disappointed with quality.',
    'Good value for money.',
    'Would recommend to others.',
    "Wouldn't buy again.",
  ];

  const result: any[] = [];

  for (let i = 0; i < rowCount; i++) {
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const prediction = getRandomPrediction();
    const confidence = Math.floor(Math.random() * 40) + 60; // 60-99%

    // Generate categories with the predicted category having the highest value
    const categories = [
      { name: 'Very Negative', value: Math.floor(Math.random() * 20) },
      { name: 'Slightly Negative', value: Math.floor(Math.random() * 20) },
      { name: 'Neutral', value: Math.floor(Math.random() * 20) },
      { name: 'Slightly Positive', value: Math.floor(Math.random() * 20) },
      { name: 'Very Positive', value: Math.floor(Math.random() * 20) },
    ];

    // Make sure predicted category has highest confidence
    const predictedCategoryIndex = categories.findIndex(
      (c) => c.name === prediction
    );
    if (predictedCategoryIndex >= 0) {
      categories[predictedCategoryIndex].value = confidence;
    }

    result.push({
      Text: text,
      Prediction: prediction,
      Confidence: confidence,
      categories: categories,
    });
  }

  return result;
}
