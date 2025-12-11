from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import spacy
import re
from datetime import datetime, timedelta
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize models
try:
    summarizer = pipeline(
        "summarization", 
        model="facebook/bart-large-cnn",
        tokenizer="facebook/bart-large-cnn"
    )
    nlp = spacy.load("en_core_web_sm")
    logger.info("Summarization models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load models: {e}")
    summarizer = None
    nlp = None

def generate_summary(transcript: str, max_length: int = 200, min_length: int = 50) -> str:
    """Generate meeting summary using BART"""
    if not transcript or len(transcript.strip()) < 50:
        return "Meeting too short to summarize effectively."
    
    if not summarizer:
        return "Summarization service unavailable."
    
    try:
        # Clean and prepare text
        cleaned_transcript = clean_text(transcript)
        
        # Handle long texts by chunking
        if len(cleaned_transcript.split()) > 1000:
            chunks = chunk_text(cleaned_transcript, 800)
            summaries = []
            
            for chunk in chunks:
                if len(chunk.split()) > 30:  # Only summarize substantial chunks
                    result = summarizer(
                        chunk, 
                        max_length=max_length//len(chunks), 
                        min_length=min_length//len(chunks),
                        do_sample=False,
                        truncation=True
                    )
                    summaries.append(result[0]['summary_text'])
            
            # Combine and re-summarize if needed
            combined = " ".join(summaries)
            if len(combined.split()) > 150:
                final_result = summarizer(
                    combined,
                    max_length=max_length,
                    min_length=min_length,
                    do_sample=False,
                    truncation=True
                )
                return final_result[0]['summary_text']
            return combined
        
        else:
            result = summarizer(
                cleaned_transcript,
                max_length=max_length,
                min_length=min_length,
                do_sample=False,
                truncation=True
            )
            return result[0]['summary_text']
    
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return f"Error generating summary: {str(e)}"

def extract_action_items(transcript: str) -> List[Dict]:
    """Extract action items with NER and pattern matching"""
    if not transcript or not nlp:
        return []
    
    try:
        doc = nlp(transcript)
        action_items = []
        
        # Enhanced action verbs and patterns
        ACTION_PATTERNS = [
            r"need to\s+(\w+)",
            r"should\s+(\w+)",
            r"will\s+(\w+)",
            r"going to\s+(\w+)",
            r"must\s+(\w+)",
            r"have to\s+(\w+)"
        ]
        
        ACTION_VERBS = [
            "send", "email", "call", "schedule", "meet", "review", "update", 
            "finish", "complete", "prepare", "submit", "follow up", "contact",
            "create", "build", "develop", "implement", "test", "deploy",
            "research", "analyze", "write", "document", "present", "discuss"
        ]
        
        sentences = [sent.text.strip() for sent in doc.sents]
        
        for sentence in sentences:
            if len(sentence.split()) < 3:  # Skip very short sentences
                continue
                
            # Check for action patterns
            has_action = False
            
            # Pattern matching
            for pattern in ACTION_PATTERNS:
                if re.search(pattern, sentence.lower()):
                    has_action = True
                    break
            
            # Verb matching
            if not has_action:
                has_action = any(verb in sentence.lower() for verb in ACTION_VERBS)
            
            if has_action:
                action_item = {
                    "id": len(action_items) + 1,
                    "task": sentence,
                    "assignee": extract_person(sentence),
                    "deadline": extract_deadline(sentence),
                    "priority": determine_priority(sentence),
                    "status": "pending",
                    "extracted_at": datetime.now().isoformat()
                }
                action_items.append(action_item)
        
        # Remove duplicates and sort by priority
        action_items = remove_similar_actions(action_items)
        action_items.sort(key=lambda x: {"High": 3, "Medium": 2, "Low": 1}[x["priority"]], reverse=True)
        
        return action_items[:10]  # Return top 10 action items
    
    except Exception as e:
        logger.error(f"Action extraction failed: {e}")
        return []

def extract_person(sentence: str) -> str:
    """Extract person names from sentence"""
    try:
        doc = nlp(sentence)
        persons = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]
        
        # Also check for common assignment patterns
        assignment_patterns = [
            r"(\w+)\s+will",
            r"(\w+)\s+should",
            r"(\w+)\s+needs? to",
            r"assigned to\s+(\w+)",
            r"(\w+)'s responsibility"
        ]
        
        for pattern in assignment_patterns:
            match = re.search(pattern, sentence, re.IGNORECASE)
            if match:
                persons.append(match.group(1))
        
        return persons[0] if persons else "Unassigned"
    except:
        return "Unassigned"

def extract_deadline(sentence: str) -> str:
    """Extract deadlines using regex and NER"""
    try:
        # Date patterns
        date_patterns = [
            r"by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)",
            r"(today|tomorrow|this week|next week|end of week|eod|end of day)",
            r"by\s+(end of|close of business|cob)",
            r"in\s+(\d+)\s+(days?|weeks?|months?)",
            r"(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}",
            r"\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}"
        ]
        
        sentence_lower = sentence.lower()
        
        for pattern in date_patterns:
            match = re.search(pattern, sentence_lower)
            if match:
                return match.group(0)
        
        # NER for dates
        doc = nlp(sentence)
        dates = [ent.text for ent in doc.ents if ent.label_ == "DATE"]
        if dates:
            return dates[0]
        
        return "No deadline specified"
    except:
        return "No deadline specified"

def determine_priority(sentence: str) -> str:
    """Determine priority based on urgency keywords"""
    sentence_lower = sentence.lower()
    
    urgent_keywords = [
        "urgent", "asap", "immediately", "critical", "emergency", "urgent",
        "today", "now", "right away", "high priority"
    ]
    
    medium_keywords = [
        "this week", "soon", "next week", "important", "should", 
        "needed", "required", "medium priority"
    ]
    
    if any(keyword in sentence_lower for keyword in urgent_keywords):
        return "High"
    elif any(keyword in sentence_lower for keyword in medium_keywords):
        return "Medium"
    else:
        return "Low"

def clean_text(text: str) -> str:
    """Clean transcript text for better processing"""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove filler words at start of sentences
    text = re.sub(r'\b(um|uh|like|you know|so)\b', '', text, flags=re.IGNORECASE)
    return text.strip()

def chunk_text(text: str, chunk_size: int) -> List[str]:
    """Split text into manageable chunks"""
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def remove_similar_actions(actions: List[Dict]) -> List[Dict]:
    """Remove duplicate or very similar action items"""
    if not actions:
        return actions
    
    unique_actions = []
    seen_tasks = set()
    
    for action in actions:
        task_words = set(action["task"].lower().split())
        is_similar = False
        
        for seen_task in seen_tasks:
            seen_words = set(seen_task.split())
            # If 70% of words overlap, consider it similar
            overlap = len(task_words.intersection(seen_words))
            total_words = max(len(task_words), len(seen_words))
            
            if total_words > 0 and overlap / total_words > 0.7:
                is_similar = True
                break
        
        if not is_similar:
            unique_actions.append(action)
            seen_tasks.add(action["task"].lower())
    
    return unique_actions