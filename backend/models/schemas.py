from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class TranscriptionSegment(BaseModel):
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds") 
    text: str = Field(..., description="Transcribed text")
    speaker: str = Field(default="Unknown", description="Speaker identifier")
    confidence: float = Field(default=0.0, description="Transcription confidence")

class TranscriptionResult(BaseModel):
    transcript: str = Field(..., description="Complete transcript")
    segments: List[TranscriptionSegment] = Field(default=[], description="Individual segments")
    language: str = Field(default="en", description="Detected language")
    language_probability: float = Field(default=0.0, description="Language detection confidence")
    duration: float = Field(default=0.0, description="Audio duration in seconds")
    speaker_count: int = Field(default=1, description="Number of detected speakers")

class ActionItem(BaseModel):
    id: int = Field(..., description="Unique identifier")
    task: str = Field(..., description="Task description")
    assignee: str = Field(default="Unassigned", description="Person responsible")
    deadline: str = Field(default="No deadline", description="Due date")
    priority: str = Field(default="Low", description="Priority level")
    status: str = Field(default="pending", description="Task status")
    extracted_at: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Extraction timestamp")

class SentimentScore(BaseModel):
    pos: float = Field(..., description="Positive sentiment score")
    neu: float = Field(..., description="Neutral sentiment score")
    neg: float = Field(..., description="Negative sentiment score")
    compound: float = Field(..., description="Compound sentiment score")

class SentimentAnalysis(BaseModel):
    overall_sentiment: SentimentScore
    meeting_mood: str = Field(..., description="Overall meeting mood")
    sentiment_timeline: List[Dict] = Field(default=[], description="Sentiment over time")
    speaker_sentiments: Dict[str, Any] = Field(default={}, description="Sentiment by speaker")
    insights: Dict[str, Any] = Field(default={}, description="Meeting insights")
    analysis_summary: str = Field(default="", description="Human-readable summary")

class ParticipationStats(BaseModel):
    speaker_stats: Dict[str, Any] = Field(default={}, description="Statistics by speaker")
    meeting_stats: Dict[str, Any] = Field(default={}, description="Overall meeting statistics")

class MeetingProcessingResult(BaseModel):
    transcript: str
    segments: List[TranscriptionSegment]
    summary: str
    action_items: List[ActionItem]
    sentiment: SentimentAnalysis
    participation: ParticipationStats
    processing_complete: bool = True
    processed_at: str = Field(default_factory=lambda: datetime.now().isoformat())

class EmailConfiguration(BaseModel):
    sender_email: EmailStr
    sender_password: str
    recipients: List[EmailStr]
    subject: str = "Meeting Digest"
    meeting_title: str = "Team Meeting"

class CalendarEvent(BaseModel):
    id: str
    title: str
    start: str
    link: str
    task: str

class IntegrationResult(BaseModel):
    success: bool
    message: str = ""
    error: str = ""
    details: Dict[str, Any] = {}

class EmailResult(IntegrationResult):
    recipients: List[str] = []
    subject: str = ""

class CalendarSyncResult(IntegrationResult):
    created_events: List[CalendarEvent] = []
    failed_events: List[Dict] = []
    total_created: int = 0
    total_failed: int = 0

class CompleteIntegrationResult(BaseModel):
    email: EmailResult
    calendar: CalendarSyncResult
    overall_success: bool

class HealthCheck(BaseModel):
    status: str = "healthy"
    services: Dict[str, bool] = {}
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0.0"