import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Configuration
    API_TITLE: str = "Meeting AI Assistant"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered meeting transcription, summarization, and analysis"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    RELOAD: bool = True
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # AI Model Configuration
    WHISPER_MODEL: str = "base"  # base, small, medium, large
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    
    SUMMARIZATION_MODEL: str = "facebook/bart-large-cnn"
    SENTIMENT_MODEL: str = "vader"  # vader or transformers
    
    # Email Configuration
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    
    # Google Calendar Configuration
    GOOGLE_CREDENTIALS_FILE: str = "credentials.json"
    GOOGLE_TOKEN_FILE: str = "token.json"
    GOOGLE_SCOPES: List[str] = ["https://www.googleapis.com/auth/calendar"]
    
    # File Configuration
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    SUPPORTED_AUDIO_FORMATS: List[str] = [".wav", ".mp3", ".m4a", ".flac", ".ogg"]
    
    # Processing Configuration
    MAX_TRANSCRIPT_LENGTH: int = 10000
    MAX_ACTION_ITEMS: int = 10
    CHUNK_SIZE: int = 800
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "meeting_ai.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()