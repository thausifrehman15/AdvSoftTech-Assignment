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
    
    # Format sentiment scores as list of objects
    sentiment_scores = [
        {"name": label, "value": round(score, 4)}
        for label, score in zip(labels, normalized_scores)
    ]

    # Get highest scoring sentiment as final prediction
    max_score_index = normalized_scores.index(max(normalized_scores))
    final_prediction = labels[max_score_index]
    
    # Generate random confidence between 0.5 and 1.0
    confidence = round(random.uniform(0.5, 1.0), 4)

    return {
        "text": text,
        "confidence": confidence,
        "final_prediction": final_prediction,
        "sentiment_scores": sentiment_scores,
        "timestamp": datetime.now().isoformat()
    }
