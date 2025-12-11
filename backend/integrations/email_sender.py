import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailSender:
    def __init__(self, smtp_server: str = "smtp.gmail.com", smtp_port: int = 587):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
    
    def create_meeting_digest_html(self, summary: str, action_items: List[Dict], 
                                 sentiment_data: Dict, meeting_title: str = "Team Meeting",
                                 meeting_date: str = None) -> str:
        """Create beautiful HTML email digest"""
        
        if not meeting_date:
            meeting_date = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        priority_styles = {
            "High": {"color": "#dc3545", "emoji": "🔴", "bg": "#fff5f5"},
            "Medium": {"color": "#fd7e14", "emoji": "🟡", "bg": "#fff8f0"},
            "Low": {"color": "#28a745", "emoji": "🟢", "bg": "#f8fff8"}
        }
        
        mood_data = {
            "Positive": {"emoji": "😊", "color": "#28a745"},
            "Negative": {"emoji": "😞", "color": "#dc3545"},
            "Neutral": {"emoji": "😐", "color": "#6c757d"}
        }
        
        meeting_mood = sentiment_data.get('meeting_mood', 'Neutral')
        mood_info = mood_data.get(meeting_mood, mood_data['Neutral'])
        
        # Generate priority counts
        priority_counts = {"High": 0, "Medium": 0, "Low": 0}
        for item in action_items:
            priority = item.get('priority', 'Low')
            priority_counts[priority] += 1
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Meeting Digest - {meeting_title}</title>
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6; color: #333; background-color: #f8f9fa;
                    padding: 20px;
                }}
                .container {{
                    max-width: 800px; margin: 0 auto; background: white;
                    border-radius: 12px; padding: 30px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    text-align: center; border-bottom: 3px solid #007bff;
                    padding-bottom: 20px; margin-bottom: 30px;
                }}
                .header h1 {{
                    color: #007bff; margin: 0; font-size: 28px; font-weight: 700;
                }}
                .header .subtitle {{
                    color: #6c757d; margin-top: 8px; font-size: 16px;
                }}
                .section {{
                    margin: 30px 0;
                }}
                .section h2 {{
                    color: #495057; border-left: 4px solid #007bff;
                    padding-left: 15px; font-size: 22px; margin-bottom: 20px;
                }}
                .summary {{
                    background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
                    padding: 25px; border-radius: 10px; border-left: 4px solid #2196f3;
                    font-size: 16px; line-height: 1.7;
                }}
                .action-item {{
                    border: 1px solid #dee2e6; border-radius: 10px; margin: 15px 0;
                    padding: 20px; transition: all 0.3s ease; position: relative;
                }}
                .action-item:hover {{
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                }}
                .priority-high {{ 
                    border-left: 4px solid #dc3545; background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
                }}
                .priority-medium {{ 
                    border-left: 4px solid #fd7e14; background: linear-gradient(135deg, #fff8f0 0%, #ffffff 100%);
                }}
                .priority-low {{ 
                    border-left: 4px solid #28a745; background: linear-gradient(135deg, #f8fff8 0%, #ffffff 100%);
                }}
                .priority-badge {{
                    display: inline-block; padding: 4px 12px; border-radius: 20px;
                    font-size: 12px; font-weight: bold; text-transform: uppercase;
                }}
                .task-text {{
                    margin: 12px 0; font-size: 16px; font-weight: 500;
                }}
                .task-meta {{
                    font-size: 14px; color: #6c757d; display: flex; gap: 20px;
                    flex-wrap: wrap; margin-top: 10px;
                }}
                .insights {{
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px; margin: 20px 0;
                }}
                .insight-card {{
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    padding: 25px; border-radius: 12px; text-align: center;
                    border: 1px solid #dee2e6;
                }}
                .insight-card h3 {{
                    margin-bottom: 15px; color: #495057; font-size: 16px;
                }}
                .insight-value {{
                    font-size: 36px; margin: 10px 0;
                }}
                .insight-label {{
                    font-weight: 600; color: #495057; font-size: 14px;
                }}
                .priority-summary {{
                    display: flex; justify-content: space-around; margin: 20px 0;
                    background: #f8f9fa; padding: 20px; border-radius: 10px;
                }}
                .priority-item {{
                    text-align: center;
                }}
                .footer {{
                    text-align: center; margin-top: 40px; padding-top: 20px;
                    border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;
                }}
                .no-items {{
                    text-align: center; padding: 40px; color: #6c757d;
                    background: #f8f9fa; border-radius: 10px; font-style: italic;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 {meeting_title}</h1>
                    <div class="subtitle">Meeting Digest • {meeting_date}</div>
                </div>
                
                <div class="section">
                    <h2>📝 Meeting Summary</h2>
                    <div class="summary">{summary}</div>
                </div>
        """
        
        # Action Items Section
        if action_items:
            html += f"""
                <div class="section">
                    <h2>✅ Action Items ({len(action_items)} tasks)</h2>
                    
                    <div class="priority-summary">
                        <div class="priority-item">
                            <div style="color: #dc3545; font-size: 24px; font-weight: bold;">
                                🔴 {priority_counts['High']}
                            </div>
                            <div>High Priority</div>
                        </div>
                        <div class="priority-item">
                            <div style="color: #fd7e14; font-size: 24px; font-weight: bold;">
                                🟡 {priority_counts['Medium']}
                            </div>
                            <div>Medium Priority</div>
                        </div>
                        <div class="priority-item">
                            <div style="color: #28a745; font-size: 24px; font-weight: bold;">
                                🟢 {priority_counts['Low']}
                            </div>
                            <div>Low Priority</div>
                        </div>
                    </div>
            """
            
            for i, item in enumerate(action_items, 1):
                priority = item.get('priority', 'Low')
                style = priority_styles.get(priority, priority_styles['Low'])
                
                html += f"""
                    <div class="action-item priority-{priority.lower()}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="priority-badge" style="background: {style['color']}; color: white;">
                                {style['emoji']} {priority}
                            </span>
                            <span style="color: #6c757d; font-size: 12px;">#{i}</span>
                        </div>
                        <div class="task-text">{item.get('task', '')}</div>
                        <div class="task-meta">
                            <span>👤 <strong>{item.get('assignee', 'Unassigned')}</strong></span>
                            <span>⏰ {item.get('deadline', 'No deadline')}</span>
                            <span>📊 {item.get('status', 'Pending')}</span>
                        </div>
                    </div>
                """
            
            html += "</div>"
        else:
            html += """
                <div class="section">
                    <h2>✅ Action Items</h2>
                    <div class="no-items">
                        No specific action items were identified in this meeting.
                    </div>
                </div>
            """
        
        # Meeting Insights Section
        html += f"""
                <div class="section">
                    <h2>📊 Meeting Insights</h2>
                    <div class="insights">
                        <div class="insight-card">
                            <h3>Meeting Mood</h3>
                            <div class="insight-value" style="color: {mood_info['color']};">
                                {mood_info['emoji']}
                            </div>
                            <div class="insight-label">{meeting_mood}</div>
                        </div>
                        <div class="insight-card">
                            <h3>Total Tasks</h3>
                            <div class="insight-value" style="color: #007bff;">
                                {len(action_items)}
                            </div>
                            <div class="insight-label">Action Items</div>
                        </div>
                        <div class="insight-card">
                            <h3>Priority Distribution</h3>
                            <div class="insight-value" style="color: #dc3545;">
                                {priority_counts['High']}
                            </div>
                            <div class="insight-label">High Priority</div>
                        </div>
                    </div>
                </div>
        """
        
        # Additional insights if available
        if sentiment_data.get('insights'):
            insights = sentiment_data['insights']
            if insights.get('overall_tone'):
                html += f"""
                    <div class="section">
                        <h2>🎯 Key Insights</h2>
                        <div class="summary">
                            <strong>Overall Tone:</strong> {insights['overall_tone']}
                        </div>
                    </div>
                """
        
        html += """
                <div class="footer">
                    🤖 Generated by Meeting AI Assistant<br>
                    <small>This digest was automatically created from your meeting audio</small>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def send_meeting_digest(self, sender_email: str, sender_password: str, 
                          recipients: List[str], subject: str, summary: str, 
                          action_items: List[Dict], sentiment_data: Dict, 
                          meeting_title: str = "Team Meeting") -> Dict:
        """Send meeting digest email"""
        try:
            # Validate inputs
            if not sender_email or not sender_password:
                return {"success": False, "error": "Email credentials not provided"}
            
            if not recipients:
                return {"success": False, "error": "No recipients specified"}
            
            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = sender_email
            msg['To'] = ', '.join(recipients)
            
            # Create HTML content
            html_content = self.create_meeting_digest_html(
                summary, action_items, sentiment_data, meeting_title
            )
            
            # Create plain text version
            text_content = self.create_text_digest(summary, action_items, sentiment_data, meeting_title)
            
            # Attach both versions
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(sender_email, sender_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {len(recipients)} recipients")
            
            return {
                "success": True,
                "message": f"Meeting digest sent to {len(recipients)} recipients",
                "recipients": recipients,
                "subject": subject
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                "success": False,
                "error": "Email authentication failed. Check your email and password/app password."
            }
        except smtplib.SMTPException as e:
            return {
                "success": False,
                "error": f"SMTP error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Email sending failed: {e}")
            return {
                "success": False,
                "error": f"Failed to send email: {str(e)}"
            }
    
    def create_text_digest(self, summary: str, action_items: List[Dict], 
                          sentiment_data: Dict, meeting_title: str) -> str:
        """Create plain text version of meeting digest"""
        text_parts = []
        text_parts.append(f"MEETING DIGEST: {meeting_title}")
        text_parts.append("=" * 50)
        text_parts.append(f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
        text_parts.append("")
        
        # Summary
        text_parts.append("MEETING SUMMARY:")
        text_parts.append("-" * 20)
        text_parts.append(summary)
        text_parts.append("")
        
        # Action Items
        if action_items:
            text_parts.append(f"ACTION ITEMS ({len(action_items)} tasks):")
            text_parts.append("-" * 20)
            
            for i, item in enumerate(action_items, 1):
                priority_emoji = {"High": "🔴", "Medium": "🟡", "Low": "🟢"}.get(item.get('priority', 'Low'), "🟢")
                text_parts.append(f"{i}. {priority_emoji} {item.get('task', '')}")
                text_parts.append(f"   Assignee: {item.get('assignee', 'Unassigned')}")
                text_parts.append(f"   Deadline: {item.get('deadline', 'No deadline')}")
                text_parts.append(f"   Priority: {item.get('priority', 'Low')}")
                text_parts.append("")
        else:
            text_parts.append("ACTION ITEMS:")
            text_parts.append("-" * 20)
            text_parts.append("No specific action items identified.")
            text_parts.append("")
        
        # Insights
        meeting_mood = sentiment_data.get('meeting_mood', 'Neutral')
        mood_emoji = {"Positive": "😊", "Negative": "😞", "Neutral": "😐"}.get(meeting_mood, "😐")
        
        text_parts.append("MEETING INSIGHTS:")
        text_parts.append("-" * 20)
        text_parts.append(f"Meeting Mood: {mood_emoji} {meeting_mood}")
        text_parts.append(f"Total Action Items: {len(action_items)}")
        text_parts.append("")
        
        text_parts.append("Generated by Meeting AI Assistant")
        
        return "\n".join(text_parts)
    
    def test_connection(self, sender_email: str, sender_password: str) -> Dict:
        """Test email connection"""
        try:
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(sender_email, sender_password)
            
            return {
                "success": True,
                "message": "Email connection successful"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Connection failed: {str(e)}"
            }