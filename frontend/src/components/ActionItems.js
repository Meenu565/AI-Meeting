// frontend/src/components/ActionItems.js
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Assignment,
  Add,
  Edit,
  Delete,
  Download,
  CheckCircle,
  RadioButtonUnchecked,
  Person,
  Schedule,
  Flag,
  Search,
} from '@mui/icons-material';
import axios from 'axios';

const priorityColors = {
  High: { color: 'error', emoji: '🔴', bg: '#ffebee' },
  Medium: { color: 'warning', emoji: '🟡', bg: '#fff3e0' },
  Low: { color: 'success', emoji: '🟢', bg: '#e8f5e9' },
};

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: <RadioButtonUnchecked /> },
  { value: 'in_progress', label: 'In Progress', icon: <Schedule /> },
  { value: 'completed', label: 'Completed', icon: <CheckCircle /> },
];

const ActionItems = ({ meetingData, updateMeetingData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItemDialog, setNewItemDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [itemForm, setItemForm] = useState({
    task: '',
    assignee: '',
    deadline: '',
    priority: 'Medium',
    status: 'pending',
  });

  const extractActionItems = async () => {
    if (!meetingData.transcript) {
      setError('No transcript available. Please transcribe an audio file first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/extract-actions', {
        transcript: meetingData.transcript,
        segments: meetingData.segments || [],
      });

      updateMeetingData({
        actionItems: response.data.action_items || [],
      });
    } catch (err) {
      console.error('Action items extraction error:', err);
      setError(err.response?.data?.detail || 'Action items extraction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      task: item.task,
      assignee: item.assignee,
      deadline: item.deadline,
      priority: item.priority,
      status: item.status,
    });
    setEditDialog(true);
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setItemForm({
      task: '',
      assignee: '',
      deadline: '',
      priority: 'Medium',
      status: 'pending',
    });
    setNewItemDialog(true);
  };

  const handleSaveItem = () => {
    const updatedItems = [...(meetingData.actionItems || [])];
    
    if (editingItem) {
      // Update existing item
      const index = updatedItems.findIndex(item => item.id === editingItem.id);
      if (index !== -1) {
        updatedItems[index] = {
          ...updatedItems[index],
          ...itemForm,
        };
      }
    } else {
      // Add new item
      const newItem = {
        id: Date.now(),
        ...itemForm,
        extracted_at: new Date().toISOString(),
      };
      updatedItems.push(newItem);
    }

    updateMeetingData({ actionItems: updatedItems });
    setEditDialog(false);
    setNewItemDialog(false);
  };

  const handleDeleteItem = (itemId) => {
    const updatedItems = (meetingData.actionItems || []).filter(item => item.id !== itemId);
    updateMeetingData({ actionItems: updatedItems });
  };

  const toggleItemStatus = (itemId) => {
    const updatedItems = (meetingData.actionItems || []).map(item => {
      if (item.id === itemId) {
        const currentStatus = item.status || 'pending';
        let newStatus;
        
        if (currentStatus === 'pending') newStatus = 'in_progress';
        else if (currentStatus === 'in_progress') newStatus = 'completed';
        else newStatus = 'pending';
        
        return { ...item, status: newStatus };
      }
      return item;
    });
    
    updateMeetingData({ actionItems: updatedItems });
  };

  const downloadActionItems = () => {
    if (!meetingData.actionItems || meetingData.actionItems.length === 0) return;

    const content = `Action Items
Generated: ${new Date().toLocaleString()}

${meetingData.actionItems.map((item, index) => 
  `${index + 1}. ${item.task}
   Assignee: ${item.assignee}
   Deadline: ${item.deadline}
   Priority: ${item.priority}
   Status: ${item.status}
   `).join('\n')}`;

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'action-items.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const filteredItems = (meetingData.actionItems || []).filter(item =>
    item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.assignee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStats = () => {
    const items = meetingData.actionItems || [];
    const total = items.length;
    const completed = items.filter(item => item.status === 'completed').length;
    const inProgress = items.filter(item => item.status === 'in_progress').length;
    const pending = items.filter(item => item.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  };

  const stats = getStatusStats();

  return (
    <Grid container spacing={3}>
      {/* Control Panel */}
      <Grid item xs={12} md={4}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              Action Items
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Extract and manage action items from your meeting transcript automatically.
            </Typography>

            {!meetingData.transcript && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Please transcribe an audio file first to extract action items.
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={extractActionItems}
              disabled={!meetingData.transcript || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              fullWidth
              size="large"
              sx={{ mb: 2 }}
            >
              {loading ? 'Extracting Items...' : 'Extract Action Items'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleAddNewItem}
              startIcon={<Add />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Add New Item
            </Button>

            {meetingData.actionItems && meetingData.actionItems.length > 0 && (
              <>
                <Button
                  variant="outlined"
                  onClick={downloadActionItems}
                  startIcon={<Download />}
                  fullWidth
                >
                  Download Items
                </Button>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Status Overview
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h6" color="success.main">{stats.completed}</Typography>
                      <Typography variant="caption" color="text.secondary">Completed</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.50' }}>
                      <Typography variant="h6" color="warning.main">{stats.inProgress}</Typography>
                      <Typography variant="caption" color="text.secondary">In Progress</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h6" color="text.secondary">{stats.pending}</Typography>
                  <Typography variant="caption" color="text.secondary">Pending</Typography>
                </Paper>

                <Divider sx={{ my: 2 }} />

                <TextField
                  label="Search items"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                />
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

      {/* Action Items List */}
      <Grid item xs={12} md={8}>
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              Items List ({filteredItems.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredItems.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Task</TableCell>
                      <TableCell>Assignee</TableCell>
                      <TableCell>Deadline</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <IconButton 
                            onClick={() => toggleItemStatus(item.id)}
                            color={item.status === 'completed' ? 'success' : 'default'}
                          >
                            {statusOptions.find(s => s.value === item.status)?.icon || <RadioButtonUnchecked />}
                          </IconButton>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" sx={{ 
                            textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                            opacity: item.status === 'completed' ? 0.7 : 1,
                          }}>
                            {item.task}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Person />} 
                            label={item.assignee} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<Schedule />} 
                            label={item.deadline} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<Flag />}
                            label={item.priority}
                            size="small"
                            color={priorityColors[item.priority]?.color}
                            sx={{ 
                              bgcolor: priorityColors[item.priority]?.bg,
                              fontWeight: 'medium',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Edit item">
                            <IconButton onClick={() => handleEditItem(item)} size="small">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete item">
                            <IconButton 
                              onClick={() => handleDeleteItem(item.id)} 
                              size="small" 
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                <Assignment sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No action items found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Extract action items from your meeting transcript or add them manually
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Action Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Description"
              multiline
              rows={3}
              value={itemForm.task}
              onChange={(e) => setItemForm({ ...itemForm, task: e.target.value })}
              fullWidth
            />
            <TextField
              label="Assignee"
              value={itemForm.assignee}
              onChange={(e) => setItemForm({ ...itemForm, assignee: e.target.value })}
              fullWidth
            />
            <TextField
              label="Deadline"
              value={itemForm.deadline}
              onChange={(e) => setItemForm({ ...itemForm, deadline: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={itemForm.priority}
                label="Priority"
                onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
              >
                {Object.keys(priorityColors).map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priorityColors[priority].emoji} {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={itemForm.status}
                label="Status"
                onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
              >
                {statusOptions.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* New Item Dialog */}
      <Dialog open={newItemDialog} onClose={() => setNewItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Action Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Task Description"
              multiline
              rows={3}
              value={itemForm.task}
              onChange={(e) => setItemForm({ ...itemForm, task: e.target.value })}
              fullWidth
            />
            <TextField
              label="Assignee"
              value={itemForm.assignee}
              onChange={(e) => setItemForm({ ...itemForm, assignee: e.target.value })}
              fullWidth
            />
            <TextField
              label="Deadline"
              value={itemForm.deadline}
              onChange={(e) => setItemForm({ ...itemForm, deadline: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={itemForm.priority}
                label="Priority"
                onChange={(e) => setItemForm({ ...itemForm, priority: e.target.value })}
              >
                {Object.keys(priorityColors).map(priority => (
                  <MenuItem key={priority} value={priority}>
                    {priorityColors[priority].emoji} {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewItemDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">Add Item</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ActionItems;