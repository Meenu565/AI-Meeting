// frontend/src/components/Dashboard.js
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Analytics,
  Group,
  TrendingUp,
  Psychology,
  Refresh,
  SentimentSatisfied,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const Dashboard = ({ meetingData, updateMeetingData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeSentiment = async () => {
    if (!meetingData.transcript) {
      setError('No transcript available. Please transcribe an audio file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/analyze-sentiment', {
        transcript: meetingData.transcript,
        segments: meetingData.segments || [],
      });

      updateMeetingData({
        sentiment: response.data.sentiment || {},
        participation: response.data.participation || {},
      });
    } catch (err) {
      console.error('Sentiment analysis error:', err);
      setError(err.response?.data?.detail || 'Sentiment analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (mood) => {
    const colors = {
      Positive: '#4caf50',
      Negative: '#f44336',
      Neutral: '#ff9800',
    };
    return colors[mood] || '#9e9e9e';
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      Positive: '😊',
      Negative: '😞',
      Neutral: '😐',
    };
    return emojis[mood] || '😐';
  };

  // Prepare charts data
  const prepareSentimentTimelineData = () => {
    if (!meetingData.sentiment?.sentiment_timeline) return [];
    
    return meetingData.sentiment.sentiment_timeline.map((point, index) => ({
      time: `${Math.floor(point.timestamp / 60)}:${Math.floor(point.timestamp % 60).toString().padStart(2, '0')}`,
      sentiment: Math.round(point.sentiment_score * 100) / 100,
      mood: point.mood,
    }));
  };

  const prepareSpeakerParticipationData = () => {
    if (!meetingData.participation?.speaker_stats) return [];
    
    return Object.entries(meetingData.participation.speaker_stats).map(([speaker, stats]) => ({
      speaker,
      talkTime: Math.round(stats.talk_percentage * 10) / 10,
      wordCount: stats.word_count,
      sentiment: Math.round(stats.avg_sentiment * 100) / 100,
    }));
  };

  const prepareSentimentDistributionData = () => {
    if (!meetingData.sentiment?.overall_sentiment) return [];
    
    const sentiment = meetingData.sentiment.overall_sentiment;
    return [
      { name: 'Positive', value: Math.round(sentiment.pos * 100), color: '#4caf50' },
      { name: 'Neutral', value: Math.round(sentiment.neu * 100), color: '#ff9800' },
      { name: 'Negative', value: Math.round(sentiment.neg * 100), color: '#f44336' },
    ].filter(item => item.value > 0);
  };

  const timelineData = prepareSentimentTimelineData();
  const participationData = prepareSpeakerParticipationData();
  const sentimentDistribution = prepareSentimentDistributionData();

  return (
    <Grid container spacing={3}>
      {/* Control Panel */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              Meeting Analytics
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Analyze meeting sentiment, speaker participation, and overall dynamics using AI.
            </Typography>

            {!meetingData.transcript && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please transcribe an audio file first to perform analytics.
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={analyzeSentiment}
              disabled={!meetingData.transcript || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
              fullWidth
              size="large"
            >
              {loading ? 'Analyzing...' : 'Analyze Meeting'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {meetingData.sentiment && Object.keys(meetingData.sentiment).length > 0 && (
          <Card elevation={2} sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                Quick Stats
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Overall Mood */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Meeting Mood
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    {getMoodEmoji(meetingData.sentiment.meeting_mood)}
                  </Typography>
                  <Chip
                    label={meetingData.sentiment.meeting_mood}
                    color={meetingData.sentiment.meeting_mood === 'Positive' ? 'success' : 
                           meetingData.sentiment.meeting_mood === 'Negative' ? 'error' : 'warning'}
                  />
                </Box>

                {/* Compound Score */}
                {meetingData.sentiment.overall_sentiment && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Overall Sentiment Score
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={((meetingData.sentiment.overall_sentiment.compound + 1) / 2) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                      color={meetingData.sentiment.meeting_mood === 'Positive' ? 'success' : 
                             meetingData.sentiment.meeting_mood === 'Negative' ? 'error' : 'warning'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(meetingData.sentiment.overall_sentiment.compound * 100) / 100}
                    </Typography>
                  </Box>
                )}

                {/* Speaker Count */}
                {meetingData.participation?.meeting_stats && (
                  <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="h5" color="primary">
                      {meetingData.participation.meeting_stats.total_speakers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active Speakers
                    </Typography>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Charts Section */}
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          {/* Sentiment Timeline */}
          {timelineData.length > 0 && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SentimentSatisfied color="primary" />
                        Sentiment Timeline
                    </Typography>

                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={[-1, 1]} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value} (${timelineData.find(d => d.sentiment === value)?.mood || 'Unknown'})`,
                          'Sentiment'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sentiment" 
                        stroke="#2196f3" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Speaker Participation */}
          {participationData.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group color="primary" />
                    Speaker Participation
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={participationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="speaker" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Talk Time']} />
                      <Bar dataKey="talkTime" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Sentiment Distribution */}
          {sentimentDistribution.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology color="primary" />
                    Sentiment Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sentimentDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Detailed Insights */}
          {meetingData.sentiment?.insights && (
            <Grid item xs={12}>
              <Card elevation={2}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Meeting Insights
                  </Typography>
                  
                  {meetingData.sentiment.insights.overall_tone && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <strong>Overall Tone:</strong> {meetingData.sentiment.insights.overall_tone}
                    </Alert>
                  )}

                  {meetingData.sentiment.insights.mood_changes && 
                   meetingData.sentiment.insights.mood_changes.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Mood Changes Detected
                      </Typography>
                      {meetingData.sentiment.insights.mood_changes.map((change, index) => (
                        <Chip
                          key={index}
                          label={`${Math.floor(change.timestamp / 60)}:${Math.floor(change.timestamp % 60).toString().padStart(2, '0')} - ${change.change_type} shift`}
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          color={change.change_type === 'positive' ? 'success' : 'warning'}
                        />
                      ))}
                    </Box>
                  )}

                  {meetingData.sentiment.insights.recommendations && 
                   meetingData.sentiment.insights.recommendations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Recommendations
                      </Typography>
                      {meetingData.sentiment.insights.recommendations.map((rec, index) => (
                        <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                          {rec}
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* No Data State */}
          {(!meetingData.sentiment || Object.keys(meetingData.sentiment).length === 0) && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                }}
              >
                <Analytics sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No analytics data available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analyze your meeting to see sentiment trends, speaker participation, and insights
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Dashboard;