import os
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleCalendarIntegration:
    def __init__(self, credentials_file: str = "credentials.json", token_file: str = "token.json"):
        self.credentials_file = credentials_file
        self.token_file = token_file
        self.scopes = ['https://www.googleapis.com/auth/calendar']
        self.service = None
        self.creds = None
    
    def get_auth_url(self) -> str:
        """Get Google OAuth authorization URL"""
        try:
            if not os.path.exists(self.credentials_file):
                raise FileNotFoundError(f"Credentials file {self.credentials_file} not found")
            
            flow = Flow.from_client_secrets_file(
                self.credentials_file, 
                scopes=self.scopes,
                redirect_uri='http://localhost:8000/calendar-auth-callback'
            )
            
            auth_url, _ = flow.authorization_url(prompt='consent')
            return auth_url
            
        except Exception as e:
            logger.error(f"Failed to generate auth URL: {e}")
            raise
    
    def complete_auth(self, authorization_code: str) -> Dict:
        """Complete OAuth flow with authorization code"""
        try:
            flow = Flow.from_client_secrets_file(
                self.credentials_file,
                scopes=self.scopes,
                redirect_uri='http://localhost:8000/calendar-auth-callback'
            )
            
            flow.fetch_token(code=authorization_code)
            
            # Save credentials
            with open(self.token_file, 'w') as token_file:
                token_file.write(flow.credentials.to_json())
            
            self.creds = flow.credentials
            self._build_service()
            
            return {
                "success": True,
                "message": "Google Calendar authorization completed successfully"
            }
            
        except Exception as e:
            logger.error(f"Auth completion failed: {e}")
            return {
                "success": False,
                "error": f"Authorization failed: {str(e)}"
            }
    
    def _load_credentials(self) -> bool:
        """Load existing credentials"""
        try:
            if os.path.exists(self.token_file):
                self.creds = Credentials.from_authorized_user_file(self.token_file, self.scopes)
            
            # Refresh if expired
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
                # Save refreshed credentials
                with open(self.token_file, 'w') as token:
                    token.write(self.creds.to_json())
            
            return self.creds and self.creds.valid
            
        except Exception as e:
            logger.error(f"Failed to load credentials: {e}")
            return False
    
    def _build_service(self):
        """Build Google Calendar service"""
        try:
            if self.creds and self.creds.valid:
                self.service = build('calendar', 'v3', credentials=self.creds)
                logger.info("Google Calendar service initialized")
            else:
                logger.warning("Invalid credentials for Google Calendar service")
        except Exception as e:
            logger.error(f"Failed to build Calendar service: {e}")
            raise
    
    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        return self._load_credentials()
    
    def create_events_from_action_items(self, action_items: List[Dict], 
                                      meeting_title: str = "Meeting Follow-up") -> Dict:
        """Create calendar events for action items"""
        if not self.is_authenticated():
            return {
                "success": False,
                "error": "Not authenticated with Google Calendar"
            }
        
        if not self.service:
            self._build_service()
        
        try:
            created_events = []
            failed_events = []
            
            for item in action_items:
                try:
                    event_data = self._create_event_from_action_item(item, meeting_title)
                    
                    event = self.service.events().insert(
                        calendarId='primary',
                        body=event_data
                    ).execute()
                    
                    created_events.append({
                        "id": event.get('id'),
                        "title": event_data['summary'],
                        "start": event_data['start'].get('dateTime', event_data['start'].get('date')),
                        "link": event.get('htmlLink'),
                        "task": item.get('task', '')
                    })
                    
                except Exception as e:
                    logger.error(f"Failed to create event for action item: {e}")
                    failed_events.append({
                        "task": item.get('task', ''),
                        "error": str(e)
                    })
            
            return {
                "success": True,
                "created_events": created_events,
                "failed_events": failed_events,
                "total_created": len(created_events),
                "total_failed": len(failed_events)
            }
            
        except HttpError as error:
            logger.error(f"Google Calendar API error: {error}")
            return {
                "success": False,
                "error": f"Google Calendar API error: {error}"
            }
        except Exception as e:
            logger.error(f"Calendar sync failed: {e}")
            return {
                "success": False,
                "error": f"Calendar sync failed: {str(e)}"
            }
    
    def _create_event_from_action_item(self, action_item: Dict, meeting_title: str) -> Dict:
        """Create calendar event structure from action item"""
        task = action_item.get('task', 'Follow-up task')
        assignee = action_item.get('assignee', 'Unassigned')
        deadline = action_item.get('deadline', 'No deadline')
        priority = action_item.get('priority', 'Low')
        
        # Calculate event timing
        start_time, end_time = self._calculate_event_timing(deadline)
        
        # Priority emoji
        priority_emoji = {
            "High": "🔴",
            "Medium": "🟡", 
            "Low": "🟢"
        }.get(priority, "📋")
        
        # Create event
        event = {
            'summary': f"{priority_emoji} {task[:100]}",
            'description': self._create_event_description(action_item, meeting_title),
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 60},       # 1 hour before
                ],
            },
        }
        
        # Add attendees if assignee has email format
        if '@' in assignee:
            event['attendees'] = [{'email': assignee}]
        
        return event
    
    def _create_event_description(self, action_item: Dict, meeting_title: str) -> str:
        """Create detailed event description"""
        task = action_item.get('task', '')
        assignee = action_item.get('assignee', 'Unassigned')
        deadline = action_item.get('deadline', 'No deadline')
        priority = action_item.get('priority', 'Low')
        
        description_parts = [
            f"📋 Action Item from: {meeting_title}",
            f"",
            f"Task: {task}",
            f"Assignee: {assignee}",
            f"Deadline: {deadline}",
            f"Priority: {priority}",
            f"",
            f"Generated by Meeting AI Assistant on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
            f"",
            f"Complete this task and update your team on progress."
        ]
        
        return "\n".join(description_parts)
    
    def _calculate_event_timing(self, deadline: str) -> tuple:
        """Calculate event start and end times based on deadline"""
        now = datetime.now()
        
        # Parse deadline and set appropriate timing
        deadline_lower = deadline.lower()
        
        if "today" in deadline_lower:
            start_time = now.replace(hour=16, minute=0, second=0, microsecond=0)  # 4 PM today
        elif "tomorrow" in deadline_lower:
            start_time = (now + timedelta(days=1)).replace(hour=9, minute=0, second=0, microsecond=0)
        elif "this week" in deadline_lower or "end of week" in deadline_lower:
            # Find Friday of this week
            days_ahead = 4 - now.weekday()  # Friday is weekday 4
            if days_ahead <= 0:
                days_ahead += 7
            start_time = (now + timedelta(days=days_ahead)).replace(hour=15, minute=0, second=0, microsecond=0)
        elif "next week" in deadline_lower:
            # Monday of next week
            days_ahead = 7 - now.weekday()
            start_time = (now + timedelta(days=days_ahead)).replace(hour=9, minute=0, second=0, microsecond=0)
        elif any(day in deadline_lower for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
            # Find next occurrence of specified day
            days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            target_day = next(day for day in days if day in deadline_lower)
            target_weekday = days.index(target_day)
            
            days_ahead = target_weekday - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
                
            start_time = (now + timedelta(days=days_ahead)).replace(hour=10, minute=0, second=0, microsecond=0)
        else:
            # Default: tomorrow at 10 AM
            start_time = (now + timedelta(days=1)).replace(hour=10, minute=0, second=0, microsecond=0)
        
        # Event duration: 1 hour
        end_time = start_time + timedelta(hours=1)
        
        return start_time, end_time
    
    def get_calendar_list(self) -> Dict:
        """Get list of user's calendars"""
        if not self.is_authenticated():
            return {
                "success": False,
                "error": "Not authenticated with Google Calendar"
            }
        
        if not self.service:
            self._build_service()
        
        try:
            calendar_list = self.service.calendarList().list().execute()
            
            calendars = []
            for calendar in calendar_list.get('items', []):
                calendars.append({
                    'id': calendar['id'],
                    'name': calendar['summary'],
                    'primary': calendar.get('primary', False),
                    'access_role': calendar.get('accessRole', 'reader')
                })
            
            return {
                "success": True,
                "calendars": calendars
            }
            
        except Exception as e:
            logger.error(f"Failed to get calendar list: {e}")
            return {
                "success": False,
                "error": f"Failed to get calendar list: {str(e)}"
            }