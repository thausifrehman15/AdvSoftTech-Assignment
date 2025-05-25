from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def load_model():
    analyzer = SentimentIntensityAnalyzer()
    labels = ["Negative", "Neutral", "Positive"]
    return analyzer, labels

def predict_sentiment(text, analyzer, labels):
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
    return {"label": label, "scores": scores}