import torch
import torch.nn.functional as F
import random
from app.categories import category_keywords

def detect_category(text):
    # Random category assignment
    categories = ["Product", "Service", "Customer Support", "General"]
    return random.choice(categories)

def predict_sentiment(text, tokenizer=None, model=None, labels=None):
    # Define sentiment labels if not provided
    if labels is None:
        labels = ["Negative", "Slightly Negative", "neutral", "Slightly Positive", "Positive"]
    
    # Generate random sentiment scores that sum to 1
    raw_scores = [random.random() for _ in range(len(labels))]
    total = sum(raw_scores)
    sentiment_scores = {
        label: round(score/total, 4) 
        for label, score in zip(labels, raw_scores)
    }

    # Select random final prediction from labels
    final_prediction = random.choice(labels)

    # Text analysis metrics
    words = text.split()
    num_words = len(words)
    avg_word_len = round(sum(len(word) for word in words) / num_words, 2) if num_words > 0 else 0

    text_analysis = {
        "length": len(text),
        "word_count": num_words,
        "avg_word_length": avg_word_len,
        "has_exclamation": "!" in text,
        "has_question": "?" in text
    }

    return {
        "sentiment_scores": sentiment_scores,
        "final_prediction": final_prediction,
        "category": detect_category(text),
        "text_analysis": text_analysis
    }
