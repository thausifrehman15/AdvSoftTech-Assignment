import torch
import torch.nn.functional as F
from app.categories import category_keywords

def detect_category(text):
    text_lower = text.lower()

    # Check each category's keywords
    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                return category

    return "other"

def predict_sentiment(text, tokenizer, model, labels):
    # Tokenize and get model output
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = F.softmax(outputs.logits, dim=1).squeeze()

    # Sentiment scores with labels
    sentiment_scores = {
        label: round(prob.item(), 4)
        for label, prob in zip(labels, probs)
    }

    # Final prediction label (highest score)
    final_prediction = labels[torch.argmax(probs).item()]

    # Extra text metrics
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
