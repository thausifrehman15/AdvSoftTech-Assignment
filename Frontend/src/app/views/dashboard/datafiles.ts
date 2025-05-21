import { ChartData } from 'chart.js';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

/**
 * Sample prediction history data for single prediction view
 */
export const SAMPLE_PREDICTION_HISTORY = [
  {
    text: 'Great customer service experience with your team today!',
    result: 'Very Positive',
    confidence: 45,
    categories: [
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
    result: 'Very Negative',
    confidence: 42,
    categories: [
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
    result: 'Slightly Positive',
    confidence: 38,
    categories: [
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
    result: 'Slightly Negative',
    confidence: 35,
    categories: [
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
    result: 'Neutral',
    confidence: 40,
    categories: [
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
    result: 'Very Positive',
    confidence: 45,
    categories: [
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
    result: 'Very Negative',
    confidence: 42,
    categories: [
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
    result: 'Slightly Positive',
    confidence: 38,
    categories: [
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
    result: 'Slightly Negative',
    confidence: 35,
    categories: [
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
    result: 'Neutral',
    confidence: 40,
    categories: [
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
    result: 'Very Positive',
    confidence: 45,
    categories: [
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
    result: 'Very Negative',
    confidence: 42,
    categories: [
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
    result: 'Slightly Positive',
    confidence: 38,
    categories: [
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
        Text: "The service was exceptional and I'm very satisfied.",
        Prediction: 'Very Positive',
        Confidence: 85,
        categories: [
          { name: 'Very Negative', value: 3 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 4 },
          { name: 'Slightly Positive', value: 6 },
          { name: 'Very Positive', value: 85 },
        ],
      },
      {
        Text: "Staff was rude and the product didn't work at all.",
        Prediction: 'Very Negative',
        Confidence: 72,
        categories: [
          { name: 'Very Negative', value: 72 },
          { name: 'Slightly Negative', value: 18 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        Text: 'It functions as expected, no issues so far.',
        Prediction: 'Neutral',
        Confidence: 65,
        categories: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 8 },
          { name: 'Neutral', value: 65 },
          { name: 'Slightly Positive', value: 15 },
          { name: 'Very Positive', value: 7 },
        ],
      },
      {
        Text: 'The online experience could be improved.',
        Prediction: 'Slightly Negative',
        Confidence: 55,
        categories: [
          { name: 'Very Negative', value: 15 },
          { name: 'Slightly Negative', value: 55 },
          { name: 'Neutral', value: 20 },
          { name: 'Slightly Positive', value: 7 },
          { name: 'Very Positive', value: 3 },
        ],
      },
      {
        Text: "I'm mostly happy with my purchase.",
        Prediction: 'Slightly Positive',
        Confidence: 68,
        categories: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 7 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 68 },
          { name: 'Very Positive', value: 10 },
        ],
      },
      {
        Text: 'Product is amazing but delivery was slow.',
        Prediction: 'Slightly Positive',
        Confidence: 62,
        categories: [
          { name: 'Very Negative', value: 8 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 62 },
          { name: 'Very Positive', value: 10 },
        ],
      },
      {
        Text: 'I returned the item immediately.',
        Prediction: 'Slightly Negative',
        Confidence: 58,
        categories: [
          { name: 'Very Negative', value: 25 },
          { name: 'Slightly Negative', value: 58 },
          { name: 'Neutral', value: 12 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        Text: "It's ok I guess, nothing special.",
        Prediction: 'Neutral',
        Confidence: 70,
        categories: [
          { name: 'Very Negative', value: 5 },
          { name: 'Slightly Negative', value: 10 },
          { name: 'Neutral', value: 70 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 5 },
        ],
      },
      {
        Text: 'Great value for money, highly recommended!',
        Prediction: 'Very Positive',
        Confidence: 80,
        categories: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 3 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 80 },
        ],
      },
      {
        Text: 'The website crashed during checkout.',
        Prediction: 'Very Negative',
        Confidence: 75,
        categories: [
          { name: 'Very Negative', value: 75 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      // Add more rows to demonstrate pagination
      {
        Text: 'Not worth the price I paid.',
        Prediction: 'Slightly Negative',
        Confidence: 60,
        categories: [
          { name: 'Very Negative', value: 25 },
          { name: 'Slightly Negative', value: 60 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        Text: 'The shipping was incredibly fast!',
        Prediction: 'Very Positive',
        Confidence: 78,
        categories: [
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
        Text: 'This product changed my life!',
        Prediction: 'Very Positive',
        Confidence: 88,
        categories: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 3 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 88 },
        ],
      },
      {
        Text: 'It broke after two days of use.',
        Prediction: 'Very Negative',
        Confidence: 76,
        categories: [
          { name: 'Very Negative', value: 76 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 2 },
          { name: 'Very Positive', value: 2 },
        ],
      },
      {
        Text: 'Works as described, average performance.',
        Prediction: 'Neutral',
        Confidence: 65,
        categories: [
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
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
    isDefault: false,
    data: [
      {
        Text: 'I love your products and will keep buying them!',
        Prediction: 'Very Positive',
        Confidence: 90,
        categories: [
          { name: 'Very Negative', value: 2 },
          { name: 'Slightly Negative', value: 2 },
          { name: 'Neutral', value: 1 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 90 },
        ],
      },
      {
        Text: 'Service was average, could be improved.',
        Prediction: 'Neutral',
        Confidence: 62,
        categories: [
          { name: 'Very Negative', value: 8 },
          { name: 'Slightly Negative', value: 15 },
          { name: 'Neutral', value: 62 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Very Positive', value: 5 },
        ],
      },
      {
        Text: 'I was very disappointed with my experience.',
        Prediction: 'Slightly Negative',
        Confidence: 68,
        categories: [
          { name: 'Very Negative', value: 20 },
          { name: 'Slightly Negative', value: 68 },
          { name: 'Neutral', value: 5 },
          { name: 'Slightly Positive', value: 5 },
          { name: 'Very Positive', value: 2 },
        ],
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
        Text: 'Your promotional email was very informative.',
        Prediction: 'Slightly Positive',
        Confidence: 72,
        categories: [
          { name: 'Very Negative', value: 3 },
          { name: 'Slightly Negative', value: 5 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 72 },
          { name: 'Very Positive', value: 10 },
        ],
      },
      {
        Text: 'I find these marketing emails annoying.',
        Prediction: 'Slightly Negative',
        Confidence: 65,
        categories: [
          { name: 'Very Negative', value: 20 },
          { name: 'Slightly Negative', value: 65 },
          { name: 'Neutral', value: 10 },
          { name: 'Slightly Positive', value: 3 },
          { name: 'Very Positive', value: 2 },
        ],
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
export function mockPredictText(text: string): Observable<any> {
  // Simulate API processing time
  return of({
    text: text,
    category: 'review',
    final_prediction: getRandomPrediction(),
    sentiment_scores: generateRandomSentimentScores(),
    text_analysis: {
      avg_word_length: (text.length / (text.split(' ').length || 1)).toFixed(1),
      has_exclamation: text.includes('!'),
      has_question: text.includes('?'),
      length: text.length,
      word_count: text.split(' ').length,
    },
  }).pipe(delay(1500)); // Simulate network delay
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
            Text: 'We love your customer service approach!',
            Prediction: 'Very Positive',
            Confidence: 92,
            categories: [
              { name: 'Very Negative', value: 1 },
              { name: 'Slightly Negative', value: 2 },
              { name: 'Neutral', value: 1 },
              { name: 'Slightly Positive', value: 4 },
              { name: 'Very Positive', value: 92 },
            ],
          },
          {
            Text: 'The product is okay but delivery was slow.',
            Prediction: 'Neutral',
            Confidence: 68,
            categories: [
              { name: 'Very Negative', value: 5 },
              { name: 'Slightly Negative', value: 12 },
              { name: 'Neutral', value: 68 },
              { name: 'Slightly Positive', value: 10 },
              { name: 'Very Positive', value: 5 },
            ],
          },
          {
            Text: 'I was disappointed with the quality.',
            Prediction: 'Slightly Negative',
            Confidence: 75,
            categories: [
              { name: 'Very Negative', value: 15 },
              { name: 'Slightly Negative', value: 75 },
              { name: 'Neutral', value: 5 },
              { name: 'Slightly Positive', value: 3 },
              { name: 'Very Positive', value: 2 },
            ],
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
      result: prediction.result,
      confidence: prediction.confidence,
      categories: prediction.categories || [],
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
