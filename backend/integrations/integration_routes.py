from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Optional
import logging

from .email_sender import EmailSender
from .google_calendar import GoogleCalendarIntegration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
email_sender = EmailSender()
calendar_integration = GoogleCalendarIntegration()

class EmailConfig(BaseModel):
    sender_email: EmailStr
    sender_password: str
    recipients: List[EmailStr]
    subject: str = "Meeting Digest"
    meeting_title: str = "Team Meeting"

class MeetingData(BaseModel):
    transcript: str
    summary: str
    action_items: List[Dict]
    sentiment_data: Dict

class EmailRequest(BaseModel):
    meeting_data: MeetingData
    email_config: EmailConfig

class CalendarSyncRequest(BaseModel):
    action_items: List[Dict]
    meeting_title: str = "Meeting Follow-up"

class CompleteIntegrationRequest(BaseModel):
    meeting_data: MeetingData
    email_config: EmailConfig
    sync_calendar: bool = True
    meeting_title: str = "Team Meeting"

@router.post("/send-email")
async def send_meeting_email(request: EmailRequest):
    """Send meeting digest via email"""
    try:
        result = email_sender.send_meeting_digest(
            sender_email=request.email_config.sender_email,
            sender_password=request.email_config.sender_password,
            recipients=request.email_config.recipients,
            subject=request.email_config.subject,
            summary=request.meeting_data.summary,
            action_items=request.meeting_data.action_items,
            sentiment_data=request.meeting_data.sentiment_data,
            meeting_title=request.email_config.meeting_title
        )
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "details": result
            }
        else:
            raise HTTPException(status_code=400, detail=result["error"])
    
    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")

@router.post("/sync-calendar")
async def sync_to_calendar(request: CalendarSyncRequest):
    """Sync action items to Google Calendar"""
    try:
        if not calendar_integration.is_authenticated():
            return {
                "success": False,
                "error": "Google Calendar authentication required",
                "auth_url": calendar_integration.get_auth_url()
            }
        
        result = calendar_integration.create_events_from_action_items(
            action_items=request.action_items,
            meeting_title=request.meeting_title
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Calendar sync failed: {e}")
        raise HTTPException(status_code=500, detail=f"Calendar sync failed: {str(e)}")

@router.post("/send-and-sync")
async def send_email_and_sync_calendar(request: CompleteIntegrationRequest):
    """Send email and sync to calendar in one operation"""
    results = {
        "email": {"success": False},
        "calendar": {"success": False},
        "overall_success": False
    }
    
    try:
        # Send email
        email_result = email_sender.send_meeting_digest(
            sender_email=request.email_config.sender_email,
            sender_password=request.email_config.sender_password,
            recipients=request.email_config.recipients,
            subject=request.email_config.subject,
            summary=request.meeting_data.summary,
            action_items=request.meeting_data.action_items,
            sentiment_data=request.meeting_data.sentiment_data,
            meeting_title=request.meeting_title
        )
        results["email"] = email_result
        
        # Sync to calendar if requested and authenticated
        if request.sync_calendar:
            if calendar_integration.is_authenticated():
                calendar_result = calendar_integration.create_events_from_action_items(
                    action_items=request.meeting_data.action_items,
                    meeting_title=request.meeting_title
                )
                results["calendar"] = calendar_result
            else:
                results["calendar"] = {
                    "success": False,
                    "error": "Google Calendar authentication required",
                    "auth_url": calendar_integration.get_auth_url()
                }
        
        # Determine overall success
        results["overall_success"] = (
            results["email"]["success"] and 
            (not request.sync_calendar or results["calendar"]["success"])
        )
        
        return results
    
    except Exception as e:
        logger.error(f"Complete integration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Integration failed: {str(e)}")

@router.get("/calendar-auth-url")
async def get_calendar_auth_url():
    """Get Google Calendar authorization URL"""
    try:
        auth_url = calendar_integration.get_auth_url()
        return {
            "success": True,
            "auth_url": auth_url,
            "instructions": "Visit this URL to authorize Google Calendar access"
        }
    except Exception as e:
        logger.error(f"Failed to get auth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Auth URL generation failed: {str(e)}")

@router.post("/calendar-auth-complete")
async def complete_calendar_auth(authorization_code: str):
    """Complete Google Calendar authorization"""
    try:
        result = calendar_integration.complete_auth(authorization_code)
        return result
    except Exception as e:
        logger.error(f"Auth completion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Authorization failed: {str(e)}")

@router.get("/calendar-status")
async def get_calendar_status():
    """Check Google Calendar authentication status"""
    try:
        is_authenticated = calendar_integration.is_authenticated()
        
        if is_authenticated:
            # Get calendar list to verify access
            calendar_result = calendar_integration.get_calendar_list()
            return {
                "authenticated": True,
                "calendars": calendar_result.get("calendars", []),
                "status": "Ready to sync events"
            }
        else:
            return {
                "authenticated": False,
                "auth_url": calendar_integration.get_auth_url(),
                "status": "Authentication required"
            }
    except Exception as e:
        logger.error(f"Calendar status check failed: {e}")
        return {
            "authenticated": False,
            "error": str(e),
            "status": "Error checking authentication"
        }

@router.post("/test-email")
async def test_email_connection(sender_email: EmailStr, sender_password: str):
    """Test email connection"""
    try:
        result = email_sender.test_connection(sender_email, sender_password)
        return result
    except Exception as e:
        logger.error(f"Email test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Email test failed: {str(e)}")

@router.get("/test-email-template")
async def get_test_email_template():
    """Get sample email template for preview"""
    try:
        # Sample data for template preview
        sample_summary = "Team discussed Q4 planning, budget allocations, and upcoming product launches. Key decisions were made regarding resource allocation and timeline adjustments."
        
        sample_action_items = [
            {
                "task": "Complete user authentication module by Friday",
                "assignee": "john@company.com",
                "deadline": "Friday",
                "priority": "High"
            },
            {
                "task": "Schedule client demo for next week",
                "assignee": "sarah@company.com", 
                "deadline": "Next week",
                "priority": "Medium"
            },
            {
                "task": "Update project documentation",
                "assignee": "mike@company.com",
                "deadline": "End of week",
                "priority": "Low"
            }
        ]
        
        sample_sentiment = {
            "meeting_mood": "Positive",
            "overall_sentiment": {"compound": 0.6}
        }
        
        html_template = email_sender.create_meeting_digest_html(
            summary=sample_summary,
            action_items=sample_action_items,
            sentiment_data=sample_sentiment,
            meeting_title="Q4 Planning Meeting"
        )
        
        return {
            "success": True,
            "html_template": html_template,
            "preview_note": "This is a sample template with dummy data"
        }
    
    except Exception as e:
        logger.error(f"Template generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")

@router.get("/integration-status")
async def get_integration_status():
    """Get status of all integrations"""
    try:
        calendar_authenticated = calendar_integration.is_authenticated()
        
        return {
            "integrations": {
                "email": {
                    "available": True,
                    "status": "Ready",
                    "description": "SMTP email delivery"
                },
                "google_calendar": {
                    "available": True,
                    "authenticated": calendar_authenticated,
                    "status": "Ready" if calendar_authenticated else "Authentication Required",
                    "description": "Google Calendar event creation"
                }
            },
            "overall_status": "All integrations available"
        }
    
    except Exception as e:
        logger.error(f"Integration status check failed: {e}")
        return {
            "error": f"Status check failed: {str(e)}",
            "overall_status": "Error"
        }