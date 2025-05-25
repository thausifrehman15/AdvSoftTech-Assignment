# Makes 'app' a Python package (can be left empty)from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def load_model():
    analyzer = SentimentIntensityAnalyzer()
    labels = ["Negative", "Neutral", "Positive"]
    return analyzer, labels

analyzer, labels = load_model()

# Makes 'app' a Python package (can be left empty)