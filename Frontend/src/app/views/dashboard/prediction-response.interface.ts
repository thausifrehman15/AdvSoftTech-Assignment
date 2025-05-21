// Define the possible string literal values that final_prediction can hold
// These MUST match the keys in SentimentScores exactly.
export type SentimentKey = 
  | "Negative" 
  | "Positive" 
  | "Slightly Negative" 
  | "Slightly Positive" 
  | "neutral";

// Define the structure of the sentiment_scores object
export interface SentimentScores {
  Negative: number;
  Positive: number;
  "Slightly Negative": number; // Quotes are necessary because of the space
  "Slightly Positive": number; // Quotes are necessary because of the space
  neutral: number;
}

// Define the main response structure
export interface PredictionResponse {
  category: string;
  final_prediction: SentimentKey; // Use the specific SentimentKey type here
  sentiment_scores: SentimentScores;
  text: string;
  text_analysis: {
    avg_word_length: number;
    has_exclamation: boolean;
    has_question: boolean;
    length: number;
    word_count: number;
  };
}