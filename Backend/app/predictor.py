import random
from datetime import datetime

def detect_category(text):
    categories = ["Product", "Service", "Customer Support", "General"]
    return random.choice(categories)

def predict_sentiment(text, tokenizer=None, model=None, labels=None):
    if labels is None:
        labels = ["Negative", "Slightly Negative", "neutral", "Slightly Positive", "Positive"]
    
    # Generate random sentiment scores that sum to 1
    raw_scores = [random.random() for _ in range(len(labels))]
    total = sum(raw_scores)
    normalized_scores = [score/total for score in raw_scores]
    
    # Format sentiment scores as list of objects and find maximum score
    sentiment_scores = []
    max_score = 0
    max_label = ""
    
    for label, score in zip(labels, normalized_scores):
        rounded_score = round(score, 4)
        sentiment_scores.append({"name": label, "value": rounded_score})
        if rounded_score > max_score:
            max_score = rounded_score
            max_label = label

    return {
        "text": text,
        "confidence": max_score,  # Using max score as confidence
        "final_prediction": max_label,  # Using label with max score as final prediction
        "sentiment_scores": sentiment_scores,
        "timestamp": datetime.now().isoformat()
    }
