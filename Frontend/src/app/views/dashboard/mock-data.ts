export const mockData = {
  login: {
    token: 'mock-jwt-token-12345',
    user: {
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com'
    },
    message: 'Login successful'
  },

  register: {
    success: true,
    message: 'Registration successful',
    user: {
      id: 'user123',
      username: 'testuser',
      email: 'test@example.com'
    }
  },

  prediction: {
    prediction: 'Very Positive',
    confidence: 0.92,
    final_prediction: 'Very Positive',
    sentiment_scores: {
      'Very Positive': 0.92,
      'Slightly Positive': 0.05,
      'Neutral': 0.02,
      'Slightly Negative': 0.01,
      'Very Negative': 0.00
    },
    timestamp: new Date().toISOString()
  },

  fileUpload: {
    fileId: 'file123',
    name: 'test.csv',
    status: 'uploaded',
    message: 'File uploaded successfully',
    timestamp: new Date().toString()
  },

  fileList: {
    pendingFiles: [
      {
        id: 'file124',
        name: 'pending.csv',
        timestamp: new Date().toString()
      }
    ],
    completedFiles: [
      {
        id: 'file123',
        name: 'completed.csv',
        status: 'processed',
        timestamp: new Date().toString()
      }
    ],
    count: 2
  },

  fileDetail: {
    id: 'file123',
    name: 'test.csv',
    status: 'processed',
    uploadedAt: new Date().toString(),
    timestamp: new Date().toString(),
    processedAt: new Date().toString(),
    data: [
      { text: 'I am happy', prediction: 'Positive', confidence: 0.95 },
      { text: 'I am sad', prediction: 'Negative', confidence: 0.85 }
    ]
  },

  fileStatus: {
    id: 'file123',
    status: 'processing',
    progress: 75,
    message: 'Processing file...'
  },

  userData: {
    username: 'testuser',
    email: 'test@example.com',
    totalPredictions: 150,
    totalFiles: 5,
    predictionHistory: [
      {
        text: 'I am feeling great today!',
        result: 'Positive',
        confidence: 0.95,
        categories: [
          { name: 'Very Positive', value: 85 },
          { name: 'Slightly Positive', value: 10 },
          { name: 'Neutral', value: 3 },
          { name: 'Slightly Negative', value: 1 },
          { name: 'Very Negative', value: 1 }
        ],
        timestamp: new Date().toString()
      }
    ],
    pendingFiles: [
      {
        id: 'file124',
        name: 'pending.csv',
        timestamp: new Date().toString()
      }
    ],
    completedFiles: [
      {
        id: 'file123',
        name: 'completed.csv',
        status: 'processed',
        timestamp: new Date().toString()
      }
    ]
  }
};
