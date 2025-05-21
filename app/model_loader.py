from transformers import AutoTokenizer, AutoModelForSequenceClassification

def load_model():
    # Hugging Face pre-trained sentiment model
    model_path = "distilbert-base-uncased-finetuned-sst-2-english"

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    labels = ["negative", "positive"]  # Adjust if your model uses different labels
    return tokenizer, model, labels
