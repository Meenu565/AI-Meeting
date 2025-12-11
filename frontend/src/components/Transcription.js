// frontend/src/components/Transcription.js
import React, { useState, useRef, useCallback } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Fade,
  Grid,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Stop,
  Refresh,
  Download,
  Mic,
  VolumeUp,
  Person,
  AccessTime,
  Language,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const Transcription = ({ meetingData, updateMeetingData }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.flac', '.ogg'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles[0]?.errors || [];
      if (errors.some(e => e.code === 'file-too-large')) {
        setError('File is too large. Maximum size is 100MB.');
      } else if (errors.some(e => e.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload an audio file (.wav, .mp3, .m4a, .flac, .ogg).');
      } else {
        setError('File upload failed. Please try again.');
      }
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProcessing(true);
    setProgress(0);
    setError('');

    try {
      const response = await axios.post('/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      const result = response.data;
      updateMeetingData({
        transcript: result.transcript,
        segments: result.segments || [],
        language: result.language,
        duration: result.duration,
        speakerCount: result.speaker_count,
      });

      setProgress(100);
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.response?.data?.detail || 'Transcription failed. Please try again.');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleCompleteProcess = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setProcessing(true);
    setProgress(0);
    setError('');

    try {
      const response = await axios.post('/process-complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      const result = response.data;
      updateMeetingData({
        transcript: result.transcript,
        segments: result.segments || [],
        summary: result.summary,
        actionItems: result.action_items || [],
        sentiment: result.sentiment || {},
        participation: result.participation || {},
        language: result.language,
        duration: result.duration,
        speakerCount: result.speaker_count,
      });

      setProgress(100);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.response?.data?.detail || 'Complete processing failed. Please try again.');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const downloadTranscript = () => {
    if (!meetingData.transcript) return;
    
    const element = document.createElement('a');
    const file = new Blob([meetingData.transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'meeting-transcript.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearAll = () => {
    setFile(null);
    setError('');
    setProgress(0);
    updateMeetingData({
      transcript: '',
      segments: [],
      summary: '',
      actionItems: [],
      sentiment: {},
      participation: {},
    });
  };

  return (
    <Grid container spacing={3}>
      {/* Upload Section */}
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUpload color="primary" />
              Upload Audio File
            </Typography>

            {/* File Upload Area */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'primary.50' : 'grey.50',
                transition: 'all 0.3s ease',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                },
              }}
            >
              <input {...getInputProps()} />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h6" color="primary">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop audio file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports: WAV, MP3, M4A, FLAC, OGG (max 100MB)
                </Typography>
              </Box>
            </Box>

            {/* File Info */}
            {file && (
              <Fade in={!!file}>
                <Paper elevation={1} sx={{ mt: 2, p: 2, bgcolor: 'success.50' }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VolumeUp />
                    Selected File
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)} • {file.type}
                  </Typography>
                </Paper>
              </Fade>
            )}

            {/* Progress */}
            {uploading && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {progress < 100 ? 'Uploading...' : 'Processing...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            )}

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!file || uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <Mic />}
                fullWidth
              >
                {uploading ? 'Transcribing...' : 'Transcribe Only'}
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCompleteProcess}
                disabled={!file || uploading}
                startIcon={processing ? <CircularProgress size={20} /> : <PlayArrow />}
                fullWidth
              >
                {processing ? 'Processing...' : 'Complete Analysis'}
              </Button>
            </Box>

            <Button
              variant="outlined"
              onClick={clearAll}
              startIcon={<Refresh />}
              fullWidth
              sx={{ mt: 1 }}
            >
              Clear All
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {/* Results Section */}
      <Grid item xs={12} md={6}>
        <Card elevation={2}>
          <CardContent>
            <Typography
                variant="h5"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <DescriptionIcon />
              Transcription Results
            </Typography>

            {meetingData.transcript ? (
              <>
                {/* Metadata */}
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2}>
                    {meetingData.language && (
                      <Grid item xs={6} sm={3}>
                        <Chip
                          icon={<Language />}
                          label={`Language: ${meetingData.language?.toUpperCase()}`}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                    )}
                    {meetingData.duration && (
                      <Grid item xs={6} sm={3}>
                        <Chip
                          icon={<AccessTime />}
                          label={`Duration: ${formatDuration(meetingData.duration)}`}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                    )}
                    {meetingData.speakerCount && (
                      <Grid item xs={6} sm={3}>
                        <Chip
                          icon={<Person />}
                          label={`Speakers: ${meetingData.speakerCount}`}
                          variant="outlined"
                          size="small"
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Transcript */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    maxHeight: 400,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {meetingData.transcript}
                  </Typography>
                </Paper>

                <Box sx={{ display: 'flex', justify: 'flex-end', mt: 2 }}>
                  <Tooltip title="Download transcript as text file">
                    <IconButton onClick={downloadTranscript} color="primary">
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
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
                }}
              >
                <Mic sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No audio file uploaded
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload an audio file to see the transcription results here
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Segments Section */}
      {meetingData.segments && meetingData.segments.length > 0 && (
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person color="primary" />
                Speaker Segments ({meetingData.segments.length})
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  maxHeight: 300,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                }}
              >
                {meetingData.segments.map((segment, index) => (
                  <Box key={index} sx={{ p: 2, borderBottom: index < meetingData.segments.length - 1 ? '1px solid' : 'none', borderColor: 'grey.100' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Chip
                        label={segment.speaker || 'Unknown'}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDuration(segment.start)} - {formatDuration(segment.end)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {segment.text}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default Transcription;