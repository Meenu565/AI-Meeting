from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict, List
import numpy as np
import logging
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

def analyze_meeting_sentiment(transcript: str, segments: List[Dict] = None) -> Dict:
    """Comprehensive sentiment analysis of meeting"""
    try:
        if not transcript:
            return {"error": "No transcript provided"}
        
        # Overall sentiment
        overall_sentiment = analyzer.polarity_scores(transcript)
        
        # Segment-wise sentiment analysis
        segment_sentiments = []
        if segments:
            for segment in segments:
                if segment.get('text'):
                    sent_score = analyzer.polarity_scores(segment['text'])
                    segment_sentiments.append({
                        'start': segment.get('start', 0),
                        'end': segment.get('end', 0),
                        'text': segment['text'],
                        'sentiment': sent_score,
                        'speaker': segment.get('speaker', 'Unknown'),
                        'mood': classify_mood(sent_score['compound'])
                    })
        
        # Analyze sentiment trends
        sentiment_timeline = create_sentiment_timeline(segment_sentiments)
        
        # Speaker-specific sentiment analysis
        speaker_sentiments = analyze_speaker_sentiments(segment_sentiments)
        
        # Meeting insights
        insights = generate_meeting_insights(overall_sentiment, segment_sentiments, speaker_sentiments)
        
        return {
            "overall_sentiment": overall_sentiment,
            "meeting_mood": classify_mood(overall_sentiment['compound']),
            "sentiment_timeline": sentiment_timeline,
            "speaker_sentiments": speaker_sentiments,
            "segment_sentiments": segment_sentiments,
            "insights": insights,
            "analysis_summary": create_sentiment_summary(overall_sentiment, speaker_sentiments)
        }
    
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return {"error": f"Sentiment analysis failed: {str(e)}"}

def classify_mood(compound_score: float) -> str:
    """Classify mood based on compound sentiment score"""
    if compound_score >= 0.05:
        return "Positive"
    elif compound_score <= -0.05:
        return "Negative"
    else:
        return "Neutral"

def analyze_speaker_participation(segments: List[Dict]) -> Dict:
    """Analyze speaker participation metrics"""
    try:
        if not segments:
            return {"error": "No segments provided"}
        
        speaker_stats = defaultdict(lambda: {
            'talk_time': 0,
            'word_count': 0,
            'segments': 0,
            'avg_sentiment': 0,
            'sentiment_scores': []
        })
        
        total_time = 0
        total_words = 0
        
        for segment in segments:
            speaker = segment.get('speaker', 'Unknown')
            duration = segment.get('end', 0) - segment.get('start', 0)
            text = segment.get('text', '')
            word_count = len(text.split()) if text else 0
            
            total_time += duration
            total_words += word_count
            
            # Update speaker stats
            speaker_stats[speaker]['talk_time'] += duration
            speaker_stats[speaker]['word_count'] += word_count
            speaker_stats[speaker]['segments'] += 1
            
            # Sentiment for this segment
            if text:
                sentiment = analyzer.polarity_scores(text)
                speaker_stats[speaker]['sentiment_scores'].append(sentiment['compound'])
        
        # Calculate percentages and averages
        processed_stats = {}
        for speaker, stats in speaker_stats.items():
            avg_sentiment = np.mean(stats['sentiment_scores']) if stats['sentiment_scores'] else 0
            
            processed_stats[speaker] = {
                'talk_time': round(stats['talk_time'], 2),
                'talk_percentage': round((stats['talk_time'] / total_time * 100) if total_time > 0 else 0, 1),
                'word_count': stats['word_count'],
                'word_percentage': round((stats['word_count'] / total_words * 100) if total_words > 0 else 0, 1),
                'segments': stats['segments'],
                'avg_sentiment': round(avg_sentiment, 3),
                'mood': classify_mood(avg_sentiment),
                'words_per_segment': round(stats['word_count'] / stats['segments'] if stats['segments'] > 0 else 0, 1)
            }
        
        # Meeting-level insights
        most_talkative = max(processed_stats.keys(), 
                           key=lambda x: processed_stats[x]['talk_percentage']) if processed_stats else None
        most_positive = max(processed_stats.keys(), 
                          key=lambda x: processed_stats[x]['avg_sentiment']) if processed_stats else None
        
        return {
            "speaker_stats": dict(processed_stats),
            "meeting_stats": {
                "total_time": round(total_time, 2),
                "total_words": total_words,
                "total_speakers": len(processed_stats),
                "most_talkative_speaker": most_talkative,
                "most_positive_speaker": most_positive
            }
        }
    
    except Exception as e:
        logger.error(f"Participation analysis failed: {e}")
        return {"error": f"Participation analysis failed: {str(e)}"}

def analyze_speaker_sentiments(segment_sentiments: List[Dict]) -> Dict:
    """Analyze sentiment by speaker"""
    speaker_sentiments = defaultdict(list)
    
    for segment in segment_sentiments:
        speaker = segment.get('speaker', 'Unknown')
        sentiment_score = segment.get('sentiment', {}).get('compound', 0)
        speaker_sentiments[speaker].append(sentiment_score)
    
    # Calculate statistics for each speaker
    processed_sentiments = {}
    for speaker, scores in speaker_sentiments.items():
        if scores:
            avg_sentiment = np.mean(scores)
            processed_sentiments[speaker] = {
                'avg_sentiment': round(avg_sentiment, 3),
                'sentiment_trend': [round(s, 3) for s in scores],
                'mood': classify_mood(avg_sentiment),
                'sentiment_range': {
                    'min': round(min(scores), 3),
                    'max': round(max(scores), 3),
                    'std': round(np.std(scores), 3)
                },
                'total_segments': len(scores)
            }
    
    return dict(processed_sentiments)

def create_sentiment_timeline(segment_sentiments: List[Dict]) -> List[Dict]:
    """Create timeline of sentiment throughout meeting"""
    if not segment_sentiments:
        return []
    
    timeline = []
    for i, segment in enumerate(segment_sentiments):
        timeline.append({
            'timestamp': segment.get('start', 0),
            'sentiment_score': segment.get('sentiment', {}).get('compound', 0),
            'mood': segment.get('mood', 'Neutral'),
            'speaker': segment.get('speaker', 'Unknown'),
            'segment_index': i
        })
    
    return timeline

def generate_meeting_insights(overall_sentiment: Dict, segment_sentiments: List[Dict], 
                            speaker_sentiments: Dict) -> Dict:
    """Generate actionable insights about meeting dynamics"""
    insights = {
        "overall_tone": "",
        "mood_changes": [],
        "speaker_dynamics": {},
        "recommendations": []
    }
    
    try:
        # Overall tone assessment
        compound = overall_sentiment.get('compound', 0)
        if compound > 0.1:
            insights["overall_tone"] = "The meeting had a positive and collaborative atmosphere."
        elif compound < -0.1:
            insights["overall_tone"] = "The meeting showed some tension or negative sentiment."
        else:
            insights["overall_tone"] = "The meeting maintained a neutral, professional tone."
        
        # Detect mood changes
        if len(segment_sentiments) > 5:
            sentiment_scores = [s.get('sentiment', {}).get('compound', 0) for s in segment_sentiments]
            
            # Find significant mood shifts
            for i in range(1, len(sentiment_scores)):
                change = sentiment_scores[i] - sentiment_scores[i-1]
                if abs(change) > 0.3:  # Significant change threshold
                    mood_change = {
                        'timestamp': segment_sentiments[i].get('start', 0),
                        'change_type': 'positive' if change > 0 else 'negative',
                        'magnitude': abs(change),
                        'speaker': segment_sentiments[i].get('speaker', 'Unknown')
                    }
                    insights["mood_changes"].append(mood_change)
        
        # Speaker dynamics
        if speaker_sentiments:
            most_positive = max(speaker_sentiments.keys(), 
                              key=lambda x: speaker_sentiments[x]['avg_sentiment'])
            most_negative = min(speaker_sentiments.keys(), 
                              key=lambda x: speaker_sentiments[x]['avg_sentiment'])
            
            insights["speaker_dynamics"] = {
                "most_positive": most_positive,
                "most_negative": most_negative,
                "sentiment_spread": round(
                    speaker_sentiments[most_positive]['avg_sentiment'] - 
                    speaker_sentiments[most_negative]['avg_sentiment'], 3
                )
            }
        
        # Generate recommendations
        if compound < -0.1:
            insights["recommendations"].append("Consider addressing concerns raised during the meeting")
            insights["recommendations"].append("Follow up individually with participants who seemed disengaged")
        
        if len(insights["mood_changes"]) > 3:
            insights["recommendations"].append("Meeting had multiple mood shifts - consider shorter, more focused sessions")
        
        return insights
    
    except Exception as e:
        logger.error(f"Insight generation failed: {e}")
        return insights

def create_sentiment_summary(overall_sentiment: Dict, speaker_sentiments: Dict) -> str:
    """Create human-readable sentiment summary"""
    try:
        compound = overall_sentiment.get('compound', 0)
        positive = overall_sentiment.get('pos', 0)
        negative = overall_sentiment.get('neg', 0)
        neutral = overall_sentiment.get('neu', 0)
        
        summary_parts = []
        
        # Overall assessment
        if compound > 0.1:
            summary_parts.append("The meeting had an overall positive tone")
        elif compound < -0.1:
            summary_parts.append("The meeting showed some negative sentiment")
        else:
            summary_parts.append("The meeting maintained a neutral tone")
        
        # Breakdown
        summary_parts.append(f"with {positive*100:.0f}% positive, {negative*100:.0f}% negative, and {neutral*100:.0f}% neutral language")
        
        # Speaker insights
        if speaker_sentiments:
            speaker_moods = [data['mood'] for data in speaker_sentiments.values()]
            positive_speakers = speaker_moods.count('Positive')
            negative_speakers = speaker_moods.count('Negative')
            
            if positive_speakers > negative_speakers:
                summary_parts.append(f"Most participants ({positive_speakers}/{len(speaker_sentiments)}) expressed positive sentiment")
            elif negative_speakers > positive_speakers:
                summary_parts.append(f"Several participants ({negative_speakers}/{len(speaker_sentiments)}) showed negative sentiment")
        
        return ". ".join(summary_parts) + "."
    
    except Exception as e:
        logger.error(f"Summary creation failed: {e}")
        return "Unable to generate sentiment summary."