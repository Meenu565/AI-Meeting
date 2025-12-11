// frontend/src/components/EmailSender.js
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Grid,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email,
  Send,
  Preview,
  Close,
  CheckCircle,
  Settings,
  PersonAdd,
  Visibility,
} from '@mui/icons-material';
import axios from 'axios';

const EmailSender = ({ meetingData }) => {
  const [emailForm, setEmailForm] = useState({
    senderEmail: '',
    senderPassword: '',
    recipients: [],
    subject: 'Meeting Digest',
    meetingTitle: 'Team Meeting',
  });
  const [recipientInput, setRecipientInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addRecipient = () => {
    if (!recipientInput.trim()) return;
    
    const emails = recipientInput.split(',').map(email => email.trim()).filter(Boolean);
    const validEmails = emails.filter(email => isValidEmail(email));
    const invalidEmails = emails.filter(email => !isValidEmail(email));
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }
    
    const newRecipients = [...new Set([...emailForm.recipients, ...validEmails])];
    setEmailForm({ ...emailForm, recipients: newRecipients });
    setRecipientInput('');
    setError('');
  };

  const removeRecipient = (emailToRemove) => {
    setEmailForm({
      ...emailForm,
      recipients: emailForm.recipients.filter(email => email !== emailToRemove)
    });
  };

  const testConnection = async () => {
    if (!emailForm.senderEmail || !emailForm.senderPassword) {
      setError('Please enter email credentials first.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await axios.post('/integrations/test-email', {
        sender_email: emailForm.senderEmail,
        sender_password: emailForm.senderPassword,
      });

      if (response.data.success) {
        setSuccess('Email connection test successful!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Email test error:', err);
      setError(err.response?.data?.detail || 'Email connection test failed.');
    } finally {
      setSending(false);
    }
  };

  const previewEmail = async () => {
    try {
      const response = await axios.get('/integrations/test-email-template');
      setPreviewHtml(response.data.html_template);
      setPreviewDialog(true);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to generate email preview.');
    }
  };

  const sendEmail = async () => {
    if (!meetingData.summary && !meetingData.actionItems?.length) {
      setError('No meeting data available. Please generate a summary or extract action items first.');
      return;
    }

    if (!emailForm.senderEmail || !emailForm.senderPassword) {
      setError('Please enter email credentials.');
      return;
    }

    if (emailForm.recipients.length === 0) {
      setError('Please add at least one recipient.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/integrations/send-email', {
        meeting_data: {
          transcript: meetingData.transcript || '',
          summary: meetingData.summary || 'No summary available.',
          action_items: meetingData.actionItems || [],
          sentiment_data: meetingData.sentiment || {},
        },
        email_config: {
          sender_email: emailForm.senderEmail,
          sender_password: emailForm.senderPassword,
          recipients: emailForm.recipients,
          subject: emailForm.subject,
          meeting_title: emailForm.meetingTitle,
        },
      });

      if (response.data.success) {
        setSuccess(`Email sent successfully to ${emailForm.recipients.length} recipient(s)!`);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Email sending error:', err);
      setError(err.response?.data?.detail || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  const canSendEmail = () => {
    return (
      emailForm.senderEmail &&
      emailForm.senderPassword &&
      emailForm.recipients.length > 0 &&
      (meetingData.summary || (meetingData.actionItems && meetingData.actionItems.length > 0))
    );
  };

  return (
    <Grid container spacing={3}>
      {/* Email Configuration */}
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Settings color="primary" />
              Email Configuration
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Sender Email"
                type="email"
                value={emailForm.senderEmail}
                onChange={(e) => setEmailForm({ ...emailForm, senderEmail: e.target.value })}
                fullWidth
                helperText="Your Gmail or other SMTP email address"
              />

              <TextField
                label="App Password"
                type="password"
                value={emailForm.senderPassword}
                onChange={(e) => setEmailForm({ ...emailForm, senderPassword: e.target.value })}
                fullWidth
                helperText="Use app-specific password for Gmail"
              />

              <Button
                variant="outlined"
                onClick={testConnection}
                disabled={sending || !emailForm.senderEmail || !emailForm.senderPassword}
                startIcon={sending ? <CircularProgress size={20} /> : <CheckCircle />}
                fullWidth
              >
                {sending ? 'Testing...' : 'Test Connection'}
              </Button>

              <Divider />

              <TextField
                label="Meeting Title"
                value={emailForm.meetingTitle}
                onChange={(e) => setEmailForm({ ...emailForm, meetingTitle: e.target.value })}
                fullWidth
              />

              <TextField
                label="Email Subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                fullWidth
              />
            </Box>
          </CardContent>
        </Card>

        {/* Recipients */}
        <Card elevation={2} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonAdd color="primary" />
              Recipients ({emailForm.recipients.length})
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                label="Add recipients"
                placeholder="email@example.com, another@example.com"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
                helperText="Enter email addresses separated by commas"
              />
              <Button
                variant="outlined"
                onClick={addRecipient}
                disabled={!recipientInput.trim()}
              >
                Add
              </Button>
            </Box>

            {emailForm.recipients.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {emailForm.recipients.map((email, index) => (
                  <Chip
                    key={index}
                    label={email}
                    onDelete={() => removeRecipient(email)}
                    deleteIcon={<Close />}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Send Email */}
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Email color="primary" />
              Send Meeting Digest
            </Typography>

            {/* Meeting Data Status */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Content:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label="Summary"
                  color={meetingData.summary ? 'success' : 'default'}
                  variant={meetingData.summary ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label={`Action Items (${meetingData.actionItems?.length || 0})`}
                  color={meetingData.actionItems?.length > 0 ? 'success' : 'default'}
                  variant={meetingData.actionItems?.length > 0 ? 'filled' : 'outlined'}
                  size="small"
                />
                <Chip
                  label="Analytics"
                  color={meetingData.sentiment && Object.keys(meetingData.sentiment).length > 0 ? 'success' : 'default'}
                  variant={meetingData.sentiment && Object.keys(meetingData.sentiment).length > 0 ? 'filled' : 'outlined'}
                  size="small"
                />
              </Box>
            </Paper>

            {!meetingData.summary && (!meetingData.actionItems || meetingData.actionItems.length === 0) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No meeting content available. Please generate a summary or extract action items first.
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={previewEmail}
                startIcon={<Visibility />}
                fullWidth
              >
                Preview Email Template
              </Button>

              <Button
                variant="contained"
                onClick={sendEmail}
                disabled={!canSendEmail() || sending}
                startIcon={sending ? <CircularProgress size={20} /> : <Send />}
                fullWidth
                size="large"
              >
                {sending ? 'Sending Email...' : `Send to ${emailForm.recipients.length} Recipient(s)`}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card elevation={2} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Setup Instructions
            </Typography>
            <Typography variant="body2" paragraph>
              For Gmail users:
            </Typography>
            <Typography variant="body2" component="div">
              1. Enable 2-factor authentication on your Google account<br/>
              2. Generate an app-specific password in your Google Account settings<br/>
              3. Use your Gmail address and the app password (not your regular password)<br/>
              4. The system will send a professionally formatted HTML email digest
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Email Preview
          <IconButton onClick={() => setPreviewDialog(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a sample template with dummy data. Your actual email will contain your meeting data.
          </Alert>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 1,
              minHeight: 400,
              bgcolor: 'white',
            }}
          >
            <iframe
              srcDoc={previewHtml}
              style={{
                width: '100%',
                height: '500px',
                border: 'none',
                borderRadius: '4px',
              }}
              title="Email Preview"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default EmailSender;