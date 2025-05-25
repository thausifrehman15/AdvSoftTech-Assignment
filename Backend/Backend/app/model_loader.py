from transformers import AutoTokenizer, AutoModelForSequenceClassification

def load_model(model_path="./sentiment_model"):
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    labels = ["Negative", "Slightly Negative", "neutral", "Positive", "Slightly Positive"]
    return tokenizer, model, labels
