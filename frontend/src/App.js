// frontend/src/App.js - Complete version
import React, { useState } from 'react';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tab,
  Tabs,
  Paper,
  Fade,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Mic,
  Description,
  Assignment,
  Analytics,
  Email,
  Event,
} from '@mui/icons-material';

import Transcription from './components/Transcription';
import Summary from './components/Summary';
import ActionItems from './components/ActionItems';
import Dashboard from './components/Dashboard';
import EmailSender from './components/EmailSender';
import CalendarSync from './components/CalendarSync';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in={value === index} timeout={300}>
          <Box sx={{ py: 3 }}>{children}</Box>
        </Fade>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [meetingData, setMeetingData] = useState({
    transcript: '',
    summary: '',
    actionItems: [],
    sentiment: {},
    participation: {},
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const updateMeetingData = (newData) => {
    setMeetingData(prev => ({ ...prev, ...newData }));
  };

  const tabs = [
    { label: 'Transcription', icon: <Mic />, component: Transcription },
    { label: 'Summary', icon: <Description />, component: Summary },
    { label: 'Action Items', icon: <Assignment />, component: ActionItems },
    { label: 'Analytics', icon: <Analytics />, component: Dashboard },
    { label: 'Email', icon: <Email />, component: EmailSender },
    { label: 'Calendar', icon: <Event />, component: CalendarSync },
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <Mic sx={{ color: 'white' }} />
            </Box>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffffff, #e3f2fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Meeting AI Assistant
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2 }}>
        {/* Navigation Tabs */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                id={`tab-${index}`}
                aria-controls={`tabpanel-${index}`}
                iconPosition="start"
                sx={{
                  gap: 1,
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.2rem',
                  },
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={tabValue} index={index}>
            <tab.component 
              meetingData={meetingData} 
              updateMeetingData={updateMeetingData}
            />
          </TabPanel>
        ))}
      </Container>
    </Box>
  );
}

export default App;