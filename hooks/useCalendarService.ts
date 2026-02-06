
import { useState, useCallback } from 'react';
import { CalendarEvent, Habit } from '../types';

// This is an architectural shell for the Calendar Sync module.
// In a real implementation, this would use the Google Calendar API Client Library.

export const useCalendarService = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock Authentication
  const connectCalendar = useCallback(async () => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsAuthenticated(true);
    setIsLoading(false);
    console.log("Calendar Service: Connected (Mock)");
  }, []);

  // Mock Fetch Events (Blockers)
  const fetchCalendarEvents = useCallback(async (start: Date, end: Date) => {
    if (!isAuthenticated) return;
    
    // In real app: await gapi.client.calendar.events.list(...)
    console.log(`Fetching events from ${start} to ${end}`);
    
    // Mock Data: Block out 1pm - 2pm today
    const mockBlock: CalendarEvent = {
        id: 'evt-1',
        title: 'Meeting with Morpheus',
        start: new Date(new Date().setHours(13, 0, 0, 0)),
        end: new Date(new Date().setHours(14, 0, 0, 0)),
        isBlocked: true
    };
    setEvents([mockBlock]);
  }, [isAuthenticated]);

  // Mock Push Session (Time Log)
  const pushSessionToCalendar = useCallback(async (habit: Habit, dateStr: string) => {
    if (!isAuthenticated) return;
    
    const startTime = new Date(dateStr);
    startTime.setHours(9, 0, 0); // Default to 9am for now
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 30); // Assume 30 min session

    const newEvent = {
        summary: `[NeoFlow] ${habit.name}`,
        description: `Category: ${habit.category}\nEnergy: ${habit.energyReq}`,
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() }
    };

    // In real app: await gapi.client.calendar.events.insert(...)
    console.log("Pushed to Calendar:", newEvent);
    return true;
  }, [isAuthenticated]);

  return {
    events,
    isAuthenticated,
    isLoading,
    connectCalendar,
    fetchCalendarEvents,
    pushSessionToCalendar
  };
};
