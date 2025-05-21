export interface UploadCsvResponse {
  text: string;
  category: string;
  final_prediction: string;
  avg_word_length: number;
  has_exclamation: boolean;
  has_question: boolean;
  length: number;
  word_count: number;
  Negative: number;
  "Slightly Negative": number;
  neutral: number;
  "Slightly Positive": number;
  Positive: number;
}