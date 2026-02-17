import { 
  Meeting, 
  MeetingLinks, 
  ConflictCheck, 
  AISchedulingSuggestion, 
  CreateMeetingResponse,
  MeetingConflict,
  TimeSlotSuggestion,
  AttendanceRecord,
  NotificationStatus
} from '@/types/meeting';

// Mock backend service for development
export class MockMeetingService {
  private meetings: Meeting[] = [];
  
  constructor() {
    // Initialize with some mock data
    this.meetings = this.generateMockMeetings();
  }

  private generateMockMeetings(): Meeting[] {
    // This would normally come from the database
    return [];
  }

  async checkConflicts(meeting: Partial<Meeting>): Promise<ConflictCheck> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock conflict checking logic
    const conflicts: MeetingConflict[] = [];
    const suggestions: TimeSlotSuggestion[] = [];
    
    // Check for time conflicts
    const meetingDateTime = new Date(`${meeting.date} ${meeting.time}`);
    const existingMeetings = this.meetings.filter(m => {
      const existingDateTime = new Date(`${m.date} ${m.time}`);
      const timeDiff = Math.abs(meetingDateTime.getTime() - existingDateTime.getTime());
      return timeDiff < (meeting.duration || 60) * 60 * 1000; // Within meeting duration
    });

    // Generate conflicts
    existingMeetings.forEach(existingMeeting => {
      // Check if any attendees overlap
      const overlappingAttendees = meeting.attendees?.filter(attendee =>
        existingMeeting.attendees.some(existing => existing.id === attendee.id)
      ) || [];

      overlappingAttendees.forEach(attendee => {
        conflicts.push({
          meetingId: existingMeeting.id,
          meetingTitle: existingMeeting.title,
          attendeeId: attendee.id,
          attendeeName: attendee.name,
          conflictTime: {
            start: new Date(`${existingMeeting.date} ${existingMeeting.time}`),
            end: new Date(new Date(`${existingMeeting.date} ${existingMeeting.time}`).getTime() + existingMeeting.duration * 60 * 1000)
          },
          severity: 'high'
        });
      });
    });

    // Generate suggestions if conflicts exist
    if (conflicts.length > 0) {
      const currentDate = new Date(meeting.date!);
      
      // Suggest times for the next 5 days
      for (let i = 0; i < 5; i++) {
        const suggestionDate = new Date(currentDate);
        suggestionDate.setDate(currentDate.getDate() + i);
        
        // Suggest different time slots
        const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        
        timeSlots.forEach(time => {
          suggestions.push({
            date: suggestionDate.toISOString().split('T')[0],
            time: time,
            duration: meeting.duration || 60,
            availabilityScore: Math.random() * 0.5 + 0.5, // 50-100% availability
            conflictCount: Math.floor(Math.random() * 3),
            suggestedBy: Math.random() > 0.5 ? 'ai' : 'calendar_analysis'
          });
        });
      }
      
      // Sort suggestions by availability score
      suggestions.sort((a, b) => b.availabilityScore - a.availabilityScore);
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      suggestions: suggestions.slice(0, 10) // Return top 10 suggestions
    };
  }

  async getAISchedulingSuggestions(meeting: Partial<Meeting>): Promise<AISchedulingSuggestion> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock AI suggestions
    const recommendedSlots: TimeSlotSuggestion[] = [];
    const currentDate = new Date();
    
    // Generate smart suggestions for the next 7 days
    for (let i = 0; i < 7; i++) {
      const suggestionDate = new Date(currentDate);
      suggestionDate.setDate(currentDate.getDate() + i + 1);
      
      // Skip weekends for business meetings
      if (suggestionDate.getDay() === 0 || suggestionDate.getDay() === 6) continue;
      
      // Suggest optimal time slots based on meeting type
      const optimalTimes = meeting.category === 'academic' 
        ? ['10:00', '11:00', '14:00', '15:00']
        : ['09:00', '10:30', '14:30', '16:00'];
      
      optimalTimes.forEach(time => {
        recommendedSlots.push({
          date: suggestionDate.toISOString().split('T')[0],
          time: time,
          duration: meeting.duration || 60,
          availabilityScore: Math.random() * 0.3 + 0.7, // 70-100% for AI suggestions
          conflictCount: Math.floor(Math.random() * 2),
          suggestedBy: 'ai'
        });
      });
    }

    // Sort by availability score
    recommendedSlots.sort((a, b) => b.availabilityScore - a.availabilityScore);

    return {
      recommendedSlots: recommendedSlots.slice(0, 8),
      optimalDuration: meeting.duration || 60,
      suggestedAttendees: meeting.attendees?.map(a => a.id) || [],
      conflictAnalysis: {
        totalConflicts: Math.floor(Math.random() * 5),
        highPriorityConflicts: Math.floor(Math.random() * 2),
        affectedAttendees: meeting.attendees?.slice(0, 2).map(a => a.name) || [],
        alternativeSlots: recommendedSlots.slice(0, 3),
        bestTimeRange: {
          start: '10:00',
          end: '11:30',
          reason: 'Highest availability across all attendees with minimal conflicts'
        }
      },
      roomSuggestions: [
        {
          roomId: 'conf-a',
          roomName: 'Conference Room A',
          capacity: 12,
          availability: true,
          amenities: ['Projector', 'Whiteboard', 'Video Conferencing'],
          bookingUrl: '#'
        },
        {
          roomId: 'board-room',
          roomName: 'Board Room',
          capacity: 8,
          availability: true,
          amenities: ['Large Display', 'Premium Audio', 'Executive Seating'],
          bookingUrl: '#'
        }
      ]
    };
  }

  async createMeeting(meeting: Meeting): Promise<CreateMeetingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate meeting links based on type
    const meetingLinks: MeetingLinks = {
      primary: 'google-meet'
    };

    if (meeting.type === 'online' || meeting.type === 'hybrid') {
      const platform = meeting.location || 'google-meet';
      
      switch (platform) {
        case 'google-meet':
          meetingLinks.googleMeet = {
            meetingId: `meet-${Date.now()}`,
            joinUrl: `https://meet.google.com/mock-${Math.random().toString(36).substr(2, 9)}`,
            hangoutLink: `https://meet.google.com/mock-${Math.random().toString(36).substr(2, 9)}`,
            conferenceId: `conf-${Math.random().toString(36).substr(2, 9)}`,
            requestId: `req-${Date.now()}`,
            status: 'success',
            createdAt: new Date()
          };
          meetingLinks.primary = 'google-meet';
          break;
          
        case 'zoom':
          meetingLinks.zoom = {
            meetingId: `${Date.now()}`,
            joinUrl: `https://zoom.us/j/${Date.now()}`,
            startUrl: `https://zoom.us/s/${Date.now()}`,
            password: Math.random().toString(36).substr(2, 8),
            meetingNumber: Date.now().toString(),
            status: 'waiting',
            createdAt: new Date()
          };
          meetingLinks.primary = 'zoom';
          break;
          
        case 'teams':
          meetingLinks.teams = {
            meetingId: `teams-${Date.now()}`,
            joinUrl: `https://teams.microsoft.com/l/meetup-join/mock-${Math.random().toString(36).substr(2, 20)}`,
            joinWebUrl: `https://teams.microsoft.com/l/meetup-join/mock-${Math.random().toString(36).substr(2, 20)}`,
            conferenceId: `conf-${Math.random().toString(36).substr(2, 9)}`,
            organizerId: meeting.createdBy,
            createdAt: new Date()
          };
          meetingLinks.primary = 'teams';
          break;
      }
    }

    // Update meeting with links
    const updatedMeeting = {
      ...meeting,
      meetingLinks,
      id: meeting.id || `meeting-${Date.now()}`,
      createdAt: meeting.createdAt || new Date(),
      updatedAt: new Date()
    };

    // Add to mock database
    this.meetings.push(updatedMeeting);

    // Generate mock notifications
    const notifications: NotificationStatus[] = updatedMeeting.attendees.map(attendee => ({
      type: 'email',
      status: Math.random() > 0.1 ? 'sent' : 'failed',
      recipient: attendee.email,
      sentAt: new Date(),
      error: Math.random() > 0.9 ? 'Email delivery failed' : undefined
    }));

    return {
      meeting: updatedMeeting,
      meetingLinks,
      notifications
    };
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const meetingIndex = this.meetings.findIndex(m => m.id === meetingId);
    if (meetingIndex === -1) {
      throw new Error('Meeting not found');
    }

    this.meetings[meetingIndex] = {
      ...this.meetings[meetingIndex],
      ...updates,
      updatedAt: new Date()
    };

    return this.meetings[meetingIndex];
  }

  async cancelMeeting(meetingId: string, reason?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const meetingIndex = this.meetings.findIndex(m => m.id === meetingId);
    if (meetingIndex === -1) {
      return false;
    }

    this.meetings[meetingIndex].status = 'cancelled';
    this.meetings[meetingIndex].updatedAt = new Date();
    
    return true;
  }

  async trackAttendance(meetingId: string): Promise<AttendanceRecord[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) return [];

    // Generate mock attendance data
    return meeting.attendees.map(attendee => ({
      attendeeId: attendee.id,
      attendeeName: attendee.name,
      joinTime: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 3600000) : undefined,
      leaveTime: Math.random() > 0.3 ? new Date() : undefined,
      duration: Math.random() * 3600,
      status: Math.random() > 0.2 ? 'present' : 'absent',
      platform: meeting.meetingLinks?.primary
    }));
  }

  async generateMOM(meetingId: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock MOM generation - would integrate with Google Docs API
    const mockDocId = `mom-${meetingId}-${Date.now()}`;
    return `https://docs.google.com/document/d/${mockDocId}/edit`;
  }

  // Get meetings for calendar view
  getMeetings(): Meeting[] {
    return this.meetings;
  }
}

// Export singleton instance for development
export const mockMeetingService = new MockMeetingService();
