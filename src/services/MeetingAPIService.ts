import { 
  Meeting, 
  MeetingLinks, 
  GoogleMeetInfo, 
  ZoomMeetingInfo, 
  TeamsMeetingInfo,
  CreateMeetingResponse,
  ConflictCheck,
  AISchedulingSuggestion,
  MeetingAPIResponse,
  AttendanceRecord
} from '@/types/meeting';
import { mockMeetingService } from './MockMeetingService';

// Cryptographically secure ID generation
function generateSecureId(prefix: string): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const randomString = Array.from(array, byte => byte.toString(36).padStart(2, '0')).join('').substring(0, 9);
  return `${prefix}-${Date.now()}-${randomString}`;
}

export class MeetingAPIService {
  private googleApiKey: string;
  private googleClientId: string;
  private zoomClientId: string;
  private zoomClientSecret: string;
  private msClientId: string;
  private msClientSecret: string;
  private msTenantId: string;
  private apiUrl: string;
  private isDevelopment: boolean;

  constructor() {
    this.googleApiKey = 'AIzaSyDmYMl3R63MJz6AqDkfTm4wqIrzd91XZa8';
    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.zoomClientId = 'cHyoPrqZQfy2obniYbmzfw';
    this.zoomClientSecret = '8u4EjbdUC1LSkxaCHqSh2IK0X7kxNAHb';
    this.msClientId = import.meta.env.VITE_MS_CLIENT_ID || '';
    this.msClientSecret = import.meta.env.VITE_MS_CLIENT_SECRET || '';
    this.msTenantId = import.meta.env.VITE_MS_TENANT_ID || '';
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    this.isDevelopment = import.meta.env.DEV || false;
  }

  // Google Calendar API Integration
  async initializeGoogleAuth(): Promise<boolean> {
    try {
      await new Promise((resolve, reject) => {
        if (typeof window.gapi === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        } else {
          resolve(null);
        }
      });

      await new Promise((resolve) => {
        window.gapi.load('auth2:client', () => resolve(null));
      });

      await window.gapi.client.init({
        apiKey: this.googleApiKey,
        clientId: this.googleClientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      return true;
    } catch (error) {
      console.error('Google Auth initialization failed:', error);
      return false;
    }
  }

  async createGoogleMeetEvent(meeting: Partial<Meeting>): Promise<GoogleMeetInfo> {
    try {
      // Explicit check for gapi availability
      if (typeof window === 'undefined' || typeof window.gapi === 'undefined') {
        throw new Error('Google API not loaded. Please refresh the page and try again.');
      }

      // Check if user is authenticated with Google
      const authInstance = window.gapi?.auth2?.getAuthInstance();
      if (!authInstance) {
        throw new Error('Google Auth not initialized. Please refresh the page and try again.');
      }

      const isSignedIn = authInstance.isSignedIn?.get();
      
      if (!isSignedIn) {
        console.warn('User not signed in to Google. Attempting to sign in...');
        try {
          await authInstance.signIn();
        } catch (authError) {
          console.error('Google authentication failed:', authError);
          throw new Error('Google authentication required. Please sign in with your Google account.');
        }
      }

      // Create a calendar event with Google Meet conference
      const startDateTime = this.formatISODateTime(meeting.date!, meeting.time!);
      const endDateTime = this.formatISODateTime(meeting.date!, meeting.time!, meeting.duration || 60);

      const event = {
        summary: meeting.title || 'Meeting',
        description: meeting.description || '',
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: meeting.attendees?.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
          responseStatus: 'needsAction'
        })) || [],
        conferenceData: {
          createRequest: {
            requestId: generateSecureId('meet'),
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      };

      // Insert event with conference data
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        resource: event
      });

      if (!response.result) {
        throw new Error('Failed to create Google Calendar event');
      }

      const conferenceData = response.result.conferenceData;
      
      // Safe property access with proper fallback logic
      let meetingLink = 'https://meet.google.com/new';
      if (conferenceData?.entryPoints && Array.isArray(conferenceData.entryPoints)) {
        const videoEntry = conferenceData.entryPoints.find((ep: any) => ep.entryPointType === 'video');
        if (videoEntry?.uri) {
          meetingLink = videoEntry.uri;
        }
      } else if (response.result.hangoutLink) {
        meetingLink = response.result.hangoutLink;
      }

      return {
        meetingId: response.result.id || generateSecureId('meet'),
        joinUrl: meetingLink,
        hangoutLink: meetingLink,
        conferenceId: conferenceData?.conferenceId || generateSecureId('conf'),
        requestId: conferenceData?.createRequest?.requestId || event.conferenceData.createRequest.requestId,
        status: 'success',
        createdAt: new Date()
      };
    } catch (error: any) {
      console.error('Google Meet creation failed:', error);
      
      // If API call fails, provide helpful error message
      if (error.message?.includes('authentication')) {
        throw new Error('Google authentication required. Please sign in with your Google account.');
      } else if (error.result?.error?.message) {
        throw new Error(`Google Calendar API error: ${error.result.error.message}`);
      } else {
        throw new Error('Failed to create Google Meet event. Please check your internet connection and try again.');
      }
    }
  }

  // Zoom API Integration
  async createZoomMeeting(meeting: Partial<Meeting>): Promise<ZoomMeetingInfo> {
    try {
      // Get Zoom access token
      const accessToken = await this.getZoomAccessToken();
      
      // Calculate meeting start time
      const startDateTime = this.formatISODateTime(meeting.date!, meeting.time!);

      // Create meeting via Zoom API
      const meetingData = {
        topic: meeting.title || 'Meeting',
        type: 2, // Scheduled meeting
        start_time: startDateTime,
        duration: meeting.duration || 60,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        agenda: meeting.description || '',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: true,
          mute_upon_entry: false,
          watermark: false,
          use_pmi: false,
          approval_type: 2, // No registration required
          audio: 'both',
          auto_recording: 'none',
          waiting_room: false
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meetingData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Zoom API error: ${errorData.message || response.statusText}`);
        }

        const zoomMeeting = await response.json();

        // Validate Zoom meeting ID before conversion
        if (!zoomMeeting.id || (typeof zoomMeeting.id !== 'number' && typeof zoomMeeting.id !== 'string')) {
          throw new Error('Invalid Zoom meeting ID received from API');
        }

        const meetingId = String(zoomMeeting.id);

        return {
          meetingId,
          joinUrl: zoomMeeting.join_url || '',
          startUrl: zoomMeeting.start_url || '',
          password: zoomMeeting.password || '',
          meetingNumber: meetingId,
          status: 'waiting',
          createdAt: new Date()
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Zoom API request timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Zoom meeting creation failed:', error);
      
      // Provide helpful error messages
      if (error.message?.includes('access token')) {
        throw new Error('Zoom authentication failed. Please check your credentials.');
      } else if (error.message?.includes('Zoom API error')) {
        throw error;
      } else if (error.message?.includes('timed out')) {
        throw error;
      } else {
        throw new Error('Failed to create Zoom meeting. Please check your internet connection and try again.');
      }
    }
  }

  private async getZoomAccessToken(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/zoom/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: this.zoomClientId,
            clientSecret: this.zoomClientSecret
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to get Zoom access token');
        }

        const data = await response.json();
        return data.access_token;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Zoom authentication request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Zoom auth failed:', error);
      throw error;
    }
  }

  // Microsoft Teams API Integration
  async createTeamsMeeting(meeting: Partial<Meeting>): Promise<TeamsMeetingInfo> {
    try {
      const accessToken = await this.getMicrosoftAccessToken();
      
      const meetingData = {
        subject: meeting.title,
        body: {
          contentType: 'HTML',
          content: meeting.description
        },
        start: {
          dateTime: this.formatISODateTime(meeting.date!, meeting.time!),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: this.formatISODateTime(meeting.date!, meeting.time!, meeting.duration!),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: meeting.attendees?.map(attendee => ({
          emailAddress: {
            address: attendee.email,
            name: attendee.name
          },
          type: attendee.isRequired ? 'required' : 'optional'
        })),
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meetingData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = response.statusText;
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch {
            // If error response is not JSON, use text
            errorMessage = errorText || errorMessage;
          }
          throw new Error(`Microsoft Graph API error: ${errorMessage}`);
        }

        const teamsEvent = await response.json();

        return {
          meetingId: teamsEvent.id || '',
          joinUrl: teamsEvent.onlineMeeting?.joinUrl || '',
          joinWebUrl: teamsEvent.onlineMeeting?.joinWebUrl || '',
          conferenceId: teamsEvent.onlineMeeting?.conferenceId || '',
          organizerId: teamsEvent.organizer?.emailAddress?.address || '',
          createdAt: new Date()
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Teams meeting creation timed out. Please try again.');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Teams meeting creation failed:', error);
      throw new Error('Failed to create Teams meeting');
    }
  }

  private async getMicrosoftAccessToken(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/microsoft/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId: this.msClientId,
            clientSecret: this.msClientSecret,
            tenantId: this.msTenantId
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to get Microsoft access token');
        }

        const data = await response.json();
        return data.access_token;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Microsoft authentication request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Microsoft auth failed:', error);
      throw error;
    }
  }

  // Main meeting creation function
  async createMeeting(meeting: Partial<Meeting>): Promise<CreateMeetingResponse> {
    if (this.isDevelopment) {
      return mockMeetingService.createMeeting(meeting as Meeting);
    }
    
    try {
      const meetingLinks: MeetingLinks = {
        primary: meeting.type === 'online' ? 'google-meet' : 'physical'
      };

      // Create meeting links based on type - Respect meetingLinks.primary field
      if (meeting.type === 'online' || meeting.type === 'hybrid') {
        // Check if meeting already has a primary platform preference
        const preferredPlatform = meeting.meetingLinks?.primary || meeting.location?.toLowerCase();
        
        switch (preferredPlatform) {
          case 'google-meet':
          case 'meet':
            meetingLinks.googleMeet = await this.createGoogleMeetEvent(meeting);
            meetingLinks.primary = 'google-meet';
            break;
          case 'zoom':
            meetingLinks.zoom = await this.createZoomMeeting(meeting);
            meetingLinks.primary = 'zoom';
            break;
          case 'teams':
          case 'microsoft-teams':
            meetingLinks.teams = await this.createTeamsMeeting(meeting);
            meetingLinks.primary = 'teams';
            break;
          default:
            // Default to Google Meet only if no preference specified
            meetingLinks.googleMeet = await this.createGoogleMeetEvent(meeting);
            meetingLinks.primary = 'google-meet';
        }
      }

      // Save meeting to IAOMS database
      const savedMeeting = await this.saveMeetingToDatabase({
        ...meeting,
        meetingLinks,
        id: generateSecureId('meeting'),
        createdAt: new Date(),
        updatedAt: new Date()
      } as Meeting);

      // Send notifications
      const notifications = await this.sendMeetingNotifications(savedMeeting);

      return {
        meeting: savedMeeting,
        meetingLinks,
        notifications
      };
    } catch (error) {
      console.error('Meeting creation failed:', error);
      throw error;
    }
  }

  // Conflict checking with AI suggestions
  async checkConflicts(meeting: Partial<Meeting>): Promise<ConflictCheck> {
    if (this.isDevelopment) {
      return mockMeetingService.checkConflicts(meeting);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/conflicts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            date: meeting.date,
            time: meeting.time,
            duration: meeting.duration,
            attendees: meeting.attendees?.map(a => a.id)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('Conflict check API returned error:', response.statusText);
          return { hasConflict: false, conflicts: [], suggestions: [] };
        }

        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Conflict check timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Conflict check failed:', error);
      return { hasConflict: false, conflicts: [], suggestions: [] };
    }
  }

  // AI-powered scheduling suggestions
  async getAISchedulingSuggestions(meeting: Partial<Meeting>): Promise<AISchedulingSuggestion> {
    if (this.isDevelopment) {
      return mockMeetingService.getAISchedulingSuggestions(meeting);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/ai-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: meeting.title,
            description: meeting.description,
            attendees: meeting.attendees?.map(a => a.id),
            preferredDuration: meeting.duration,
            department: meeting.department,
            priority: meeting.priority
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`AI suggestions API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('AI suggestions request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('AI suggestions failed:', error);
      throw error;
    }
  }

  // Attendance tracking
  async trackAttendance(meetingId: string): Promise<AttendanceRecord[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/${meetingId}/attendance`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('Attendance tracking API returned error:', response.statusText);
          return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Attendance tracking timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Attendance tracking failed:', error);
      return [];
    }
  }

  // Meeting management
  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/${meetingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Meeting update API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Meeting update request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Meeting update failed:', error);
      throw error;
    }
  }

  async cancelMeeting(meetingId: string, reason?: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/${meetingId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        return response.ok;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Meeting cancellation timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Meeting cancellation failed:', error);
      return false;
    }
  }

  async generateMOM(meetingId: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout (MOM generation may take longer)

      try {
        const response = await fetch(`${this.apiUrl}/meetings/${meetingId}/mom`, {
          method: 'POST',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`MOM generation API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.momUrl) {
          throw new Error('Invalid MOM response: missing momUrl');
        }
        return data.momUrl;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('MOM generation timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('MOM generation failed:', error);
      throw error;
    }
  }

  // Helper methods
  private formatDateTime(date: string, time: string, durationMinutes?: number): string {
    const [hours, minutes] = time.split(':');
    const meetingDate = new Date(date);
    meetingDate.setHours(parseInt(hours), parseInt(minutes));
    
    if (durationMinutes) {
      meetingDate.setMinutes(meetingDate.getMinutes() + durationMinutes);
    }
    
    return meetingDate.toISOString();
  }

  private formatISODateTime(date: string, time: string, durationMinutes?: number): string {
    return this.formatDateTime(date, time, durationMinutes);
  }

  private async saveMeetingToDatabase(meeting: Meeting): Promise<Meeting> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meeting),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Database save API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Database save request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Database save failed:', error);
      throw error;
    }
  }

  private async sendMeetingNotifications(meeting: Meeting): Promise<any[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(`${this.apiUrl}/meetings/${meeting.id}/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn('Notification API returned error:', response.statusText);
          return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('Notification request timed out');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Notification sending failed:', error);
      return [];
    }
  }
}

export const meetingAPI = new MeetingAPIService();
