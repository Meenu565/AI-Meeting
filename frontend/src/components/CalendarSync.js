import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, Check, X, AlertCircle } from 'lucide-react';

const CalendarSync = ({ actionItems = [], meetingSummary = null }) => {
  const [connectedCalendars, setConnectedCalendars] = useState([]);
  const [selectedCalendar, setSelectedCalendar] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [events, setEvents] = useState([]);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    attendees: '',
    location: '',
    calendarId: ''
  });

  // Mock calendar providers
  const calendarProviders = [
    { id: 'google', name: 'Google Calendar', color: 'bg-blue-500' },
    { id: 'outlook', name: 'Microsoft Outlook', color: 'bg-orange-500' },
    { id: 'apple', name: 'Apple Calendar', color: 'bg-gray-800' }
  ];

  useEffect(() => {
    // Load connected calendars from localStorage
    const saved = localStorage.getItem('connectedCalendars');
    if (saved) {
      setConnectedCalendars(JSON.parse(saved));
    }

    // Load events
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    // Mock upcoming events
    const mockEvents = [
      {
        id: '1',
        title: 'Team Standup',
        start: '2024-01-15T09:00:00',
        end: '2024-01-15T09:30:00',
        attendees: ['john@company.com', 'jane@company.com'],
        location: 'Conference Room A',
        calendarId: 'google'
      },
      {
        id: '2',
        title: 'Product Review',
        start: '2024-01-15T14:00:00',
        end: '2024-01-15T15:00:00',
        attendees: ['team@company.com'],
        location: 'Virtual',
        calendarId: 'outlook'
      }
    ];
    setEvents(mockEvents);
  };

  const connectCalendar = async (providerId) => {
    setIsConnecting(true);
    
    try {
      // Mock OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newCalendar = {
        id: `${providerId}_${Date.now()}`,
        providerId,
        name: calendarProviders.find(p => p.id === providerId)?.name,
        email: `user@${providerId}.com`,
        connected: true,
        color: calendarProviders.find(p => p.id === providerId)?.color
      };

      const updated = [...connectedCalendars, newCalendar];
      setConnectedCalendars(updated);
      localStorage.setItem('connectedCalendars', JSON.stringify(updated));
      
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectCalendar = (calendarId) => {
    const updated = connectedCalendars.filter(cal => cal.id !== calendarId);
    setConnectedCalendars(updated);
    localStorage.setItem('connectedCalendars', JSON.stringify(updated));
  };

  const createEventFromActionItem = (actionItem) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setNewEvent({
      title: actionItem.task || 'Follow-up Task',
      description: `Action item from meeting: ${actionItem.task}\nAssigned to: ${actionItem.assignee}\nDue: ${actionItem.due_date}`,
      startDate: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endDate: tomorrow.toISOString().split('T')[0],
      endTime: '10:00',
      attendees: actionItem.assignee || '',
      location: '',
      calendarId: connectedCalendars[0]?.id || ''
    });
    setShowCreateEvent(true);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.startDate || !selectedCalendar) return;

    const event = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      start: `${newEvent.startDate}T${newEvent.startTime}:00`,
      end: `${newEvent.endDate}T${newEvent.endTime}:00`,
      attendees: newEvent.attendees.split(',').map(email => email.trim()).filter(Boolean),
      location: newEvent.location,
      calendarId: selectedCalendar
    };

    try {
      // Mock API call to create event
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEvents([...events, event]);
      setShowCreateEvent(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        attendees: '',
        location: '',
        calendarId: ''
      });
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const formatEventTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Calendar Integration</h2>
        </div>
        <button
          onClick={() => setShowCreateEvent(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Connected Calendars */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Calendars</h3>
        
        {connectedCalendars.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No calendars connected yet</p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {connectedCalendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${calendar.color}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{calendar.name}</p>
                    <p className="text-sm text-gray-500">{calendar.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => disconnectCalendar(calendar.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {calendarProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => connectCalendar(provider.id)}
              disabled={isConnecting || connectedCalendars.some(cal => cal.providerId === provider.id)}
              className="flex items-center space-x-3 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`w-4 h-4 rounded ${provider.color}`}></div>
              <span className="text-gray-700">
                {connectedCalendars.some(cal => cal.providerId === provider.id) 
                  ? 'Connected' 
                  : `Connect ${provider.name}`
                }
              </span>
              {connectedCalendars.some(cal => cal.providerId === provider.id) && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Action Items to Events */}
      {actionItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Events from Action Items</h3>
          <div className="space-y-3">
            {actionItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.task}</p>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>Assigned: {item.assignee}</span>
                    <span>Due: {item.due_date}</span>
                  </div>
                </div>
                <button
                  onClick={() => createEventFromActionItem(item)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Create Event
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        
        {events.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatEventTime(event.start)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.attendees.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{event.attendees.length} attendees</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${connectedCalendars.find(cal => cal.id === event.calendarId)?.color || 'bg-gray-400'}`}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Create New Event</h3>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {connectedCalendars.length === 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Please connect a calendar first to create events.</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calendar</label>
                <select
                  value={selectedCalendar}
                  onChange={(e) => setSelectedCalendar(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a calendar</option>
                  {connectedCalendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.name} ({calendar.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value, endDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                <input
                  type="text"
                  value={newEvent.attendees}
                  onChange={(e) => setNewEvent({...newEvent, attendees: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email addresses separated by commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter location or meeting link"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateEvent(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !selectedCalendar}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSync;