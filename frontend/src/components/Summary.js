// frontend/src/components/Summary.js
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Skeleton,
} from '@mui/material';
import {
  Description,
  Refresh,
  Download,
  AutoAwesome,
  ContentCopy,
  Share,
} from '@mui/icons-material';
import axios from 'axios';

const Summary = ({ meetingData, updateMeetingData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    if (!meetingData.transcript) {
      setError('No transcript available. Please transcribe an audio file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/summarize', {
        transcript: meetingData.transcript,
        segments: meetingData.segments || [],
      });

      updateMeetingData({
        summary: response.data.summary,
      });
    } catch (err) {
      console.error('Summary generation error:', err);
      setError(err.response?.data?.detail || 'Summary generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    if (!meetingData.summary) return;

    const content = `Meeting Summary
Generated: ${new Date().toLocaleString()}

${meetingData.summary}`;

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'meeting-summary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copySummary = async () => {
    if (!meetingData.summary) return;

    try {
      await navigator.clipboard.writeText(meetingData.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareSummary = async () => {
    if (!meetingData.summary) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meeting Summary',
          text: meetingData.summary,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copySummary();
    }
  };

  const getSummaryStats = () => {
    if (!meetingData.summary) return null;

    const words = meetingData.summary.split(/\s+/).length;
    const sentences = meetingData.summary.split(/[.!?]+/).filter(s => s.trim()).length;
    const readingTime = Math.ceil(words / 200); // 200 WPM average

    return { words, sentences, readingTime };
  };

  const stats = getSummaryStats();

  return (
    <Grid container spacing={3}>
      {/* Control Panel */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome color="primary" />
              Generate Summary
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Create an AI-powered summary of your meeting transcript using advanced natural language processing.
            </Typography>

            {!meetingData.transcript && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please transcribe an audio file first to generate a summary.
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={generateSummary}
              disabled={!meetingData.transcript || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
              fullWidth
              size="large"
              sx={{ mb: 2 }}
            >
              {loading ? 'Generating Summary...' : 'Generate Summary'}
            </Button>

            {meetingData.summary && (
              <>
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Summary Actions
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={downloadSummary}
                    startIcon={<Download />}
                    fullWidth
                  >
                    Download Summary
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={copySummary}
                    startIcon={<ContentCopy />}
                    fullWidth
                    color={copied ? 'success' : 'primary'}
                  >
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={shareSummary}
                    startIcon={<Share />}
                    fullWidth
                  >
                    Share Summary
                  </Button>
                </Box>

                {stats && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Summary Statistics
                    </Typography>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Chip
                          label={`${stats.words} words`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Chip
                          label={`${stats.sentences} sentences`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <Chip
                          label={`${stats.readingTime} min read`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
              </>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Display */}
      <Grid item xs={12} md={8}>
        <Card elevation={2}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description color="primary" />
                Meeting Summary
              </Typography>

              {meetingData.summary && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Copy summary">
                    <IconButton onClick={copySummary} size="small">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download summary">
                    <IconButton onClick={downloadSummary} size="small">
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {loading ? (
              // Loading Skeleton
              <Box>
                <Skeleton variant="text" height={40} />
                <Skeleton variant="text" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" width="60%" />
              </Box>
            ) : meetingData.summary ? (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  minHeight: 200,
                }}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                  {meetingData.summary}
                </Typography>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  minHeight: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Description sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No summary generated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate a summary from your meeting transcript using AI
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Summary;