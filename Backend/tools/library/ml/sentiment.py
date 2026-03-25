from ..base import BaseTool
import re

class SentimentAnalysis(BaseTool):
    name = "Sentiment Analyzer"
    description = "Analyze the sentiment of text (Positive/Negative/Neutral)"
    key = "ml.sentiment"
    input_schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "The text to analyze", "format": "long"},
        },
        "required": ["text"]
    }
    output_schema = {
        "type": "object",
        "properties": {
            "polarity": {"type": "number"},
            "subjectivity": {"type": "number"},
            "classification": {"type": "string", "enum": ["Positive", "Negative", "Neutral"]}
        }
    }

    def execute(self, inputs, algo_parameters=None):
        text = inputs.get("text", "")
        
        # Simple rule-based sentiment for MVP (avoiding heavy deps like NLTK/TextBlob for now)
        positive_words = set(['good', 'great', 'excellent', 'amazing', 'happy', 'success', 'love', 'best'])
        negative_words = set(['bad', 'terrible', 'awful', 'sad', 'failure', 'hate', 'worst', 'poor'])
        
        words = re.findall(r'\w+', text.lower())
        score = 0
        for word in words:
            if word in positive_words:
                score += 1
            elif word in negative_words:
                score -= 1
                
        # Normalize roughly between -1 and 1
        polarity = max(min(score / (len(words) if words else 1) * 5, 1.0), -1.0)
        
        if polarity > 0.1:
            classification = "Positive"
        elif polarity < -0.1:
            classification = "Negative"
        else:
            classification = "Neutral"
            
        return {
            "polarity": round(polarity, 2),
            "subjectivity": 0.5, # Mocked
            "classification": classification
        }
