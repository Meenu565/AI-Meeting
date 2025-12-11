from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import tempfile
import os
import json
from typing import Dict, List
from pydantic import BaseModel

from transcription import TranscriptionService
from summarization import generate_summary, extract_action_items
from sentiment_analysis import analyze_meeting_sentiment, analyze_speaker_participation
from integrations.integration_routes import router as integration_router

app = FastAPI(
    title="Meeting AI Assistant",
    description="AI-powered meeting transcription, summarization, and analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include integration routes
app.include_router(integration_router, prefix="/integrations", tags=["integrations"])

# Initialize services
transcription_service = TranscriptionService()

class ProcessRequest(BaseModel):
    transcript: str
    segments: List[Dict] = []

@app.get("/")
async def root():
    return {
        "message": "Meeting AI Assistant API",
        "version": "1.0.0",
        "endpoints": [
            "/transcribe", "/summarize", "/extract-actions", 
            "/analyze-sentiment", "/process-complete", "/health"
        ]
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe uploaded audio file"""
    try:
        if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.flac')):
            raise HTTPException(status_code=400, detail="Unsupported audio format")
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        result = transcription_service.transcribe(tmp_path)
        os.unlink(tmp_path)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/summarize")
async def summarize_meeting(request: ProcessRequest):
    """Generate meeting summary"""
    try:
        summary = generate_summary(request.transcript)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@app.post("/extract-actions")
async def extract_actions(request: ProcessRequest):
    """Extract action items from transcript"""
    try:
        action_items = extract_action_items(request.transcript)
        return {"action_items": action_items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Action extraction failed: {str(e)}")

@app.post("/analyze-sentiment")
async def analyze_sentiment(request: ProcessRequest):
    """Analyze meeting sentiment and speaker participation"""
    try:
        sentiment_data = analyze_meeting_sentiment(request.transcript, request.segments)
        participation_data = analyze_speaker_participation(request.segments)
        
        return {
            "sentiment": sentiment_data,
            "participation": participation_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")

@app.post("/process-complete")
async def process_complete_meeting(file: UploadFile = File(...)):
    """Complete meeting processing pipeline"""
    try:
        # Transcribe
        transcription_result = await transcribe_audio(file)
        transcript = transcription_result["transcript"]
        segments = transcription_result["segments"]
        
        # Process
        summary = generate_summary(transcript)
        action_items = extract_action_items(transcript)
        sentiment_data = analyze_meeting_sentiment(transcript, segments)
        participation_data = analyze_speaker_participation(segments)
        
        return {
            "transcript": transcript,
            "segments": segments,
            "summary": summary,
            "action_items": action_items,
            "sentiment": sentiment_data,
            "participation": participation_data,
            "processing_complete": True
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Complete processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "transcription": transcription_service.is_loaded(),
            "api": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)