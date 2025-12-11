from faster_whisper import WhisperModel
import logging
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load Whisper model"""
        try:
            logger.info(f"Loading Whisper model: {self.model_size}")
            self.model = WhisperModel(
                self.model_size, 
                device="cpu", 
                compute_type="int8"
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    def transcribe(self, audio_path: str) -> Dict:
        """Transcribe audio file"""
        if not self.model:
            raise Exception("Whisper model not loaded")
        
        try:
            segments, info = self.model.transcribe(
                audio_path,
                beam_size=5,
                best_of=5,
                temperature=0
            )
            
            transcript_text = ""
            segment_list = []
            speaker_count = {}
            
            for segment in segments:
                # Simple speaker diarization simulation
                speaker_id = self._assign_speaker(segment, speaker_count)
                
                transcript_text += segment.text + " "
                segment_list.append({
                    "start": round(segment.start, 2),
                    "end": round(segment.end, 2),
                    "text": segment.text.strip(),
                    "speaker": speaker_id,
                    "confidence": getattr(segment, 'avg_logprob', -0.5)
                })
            
            return {
                "transcript": transcript_text.strip(),
                "segments": segment_list,
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "speaker_count": len(speaker_count)
            }
            
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise
    
    def _assign_speaker(self, segment, speaker_count: Dict) -> str:
        """Simple speaker assignment based on timing gaps"""
        # This is a simplified approach - in production, use proper diarization
        if not speaker_count:
            speaker_id = "Speaker_1"
            speaker_count[speaker_id] = 1
            return speaker_id
        
        # Simple logic: if gap > 2 seconds, likely new speaker
        if hasattr(segment, 'start') and segment.start > getattr(self, '_last_end', 0) + 2:
            speaker_num = len(speaker_count) % 3 + 1  # Cycle through 3 speakers
            speaker_id = f"Speaker_{speaker_num}"
        else:
            speaker_id = list(speaker_count.keys())[-1]  # Same as last
        
        speaker_count[speaker_id] = speaker_count.get(speaker_id, 0) + 1
        self._last_end = segment.end
        return speaker_id
    
    def is_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None