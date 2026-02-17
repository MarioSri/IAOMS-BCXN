export class GoogleMeetService {
  private static instance: GoogleMeetService;
  private apiKey: string;
  private isInitialized = false;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(apiKey: string = 'AIzaSyDmYMl3R63MJz6AqDkfTm4wqIrzd91XZa8'): GoogleMeetService {
    if (!GoogleMeetService.instance) {
      GoogleMeetService.instance = new GoogleMeetService(apiKey);
    }
    return GoogleMeetService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google APIs
      if (window.gapi) {
        this.initializeGapi().then(resolve).catch(reject);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://apis.google.com/js/api.js?key=${this.apiKey}`;
      script.onload = () => {
        this.initializeGapi().then(resolve).catch(reject);
      };
      script.onerror = () => reject(new Error('Failed to load Google APIs'));
      document.head.appendChild(script);
    });
  }

  private async initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: this.apiKey,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
            ]
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async createMeeting(options: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
  }): Promise<{
    meetingId: string;
    meetingUrl: string;
    hangoutLink: string;
  }> {
    await this.initialize();

    // Generate unique meeting ID
    const meetingId = `iaoms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use the official Google Meet creation endpoint
    const meetingUrl = 'https://meet.google.com/new';
    
    try {
      // This would be the actual API call in production:
      // const event = await window.gapi.client.calendar.events.insert({
      //   calendarId: 'primary',
      //   resource: {
      //     summary: options.title,
      //     description: options.description,
      //     start: { dateTime: options.startTime.toISOString() },
      //     end: { dateTime: options.endTime.toISOString() },
      //     attendees: options.attendees?.map(email => ({ email })),
      //     conferenceData: {
      //       createRequest: {
      //         requestId: meetingId,
      //         conferenceSolutionKey: { type: 'hangoutsMeet' }
      //       }
      //     }
      //   },
      //   conferenceDataVersion: 1
      // });

      // For now, return mock data
      return {
        meetingId,
        meetingUrl,
        hangoutLink: meetingUrl
      };
    } catch (error) {
      console.error('Failed to create Google Meet:', error);
      // Fallback to mock meeting
      return {
        meetingId,
        meetingUrl,
        hangoutLink: meetingUrl
      };
    }
  }

  generateMeetingId(): string {
    return `iaoms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getMeetingUrl(meetingId: string): string {
    return 'https://meet.google.com/new';
  }

  async validateMeeting(meetingId: string): Promise<boolean> {
    // In production, this would validate the meeting exists
    return meetingId.startsWith('iaoms-');
  }

  async endMeeting(meetingId: string): Promise<void> {
    // In production, this would end the meeting via API
    console.log(`Meeting ${meetingId} ended`);
  }

  getEmbedUrl(meetingId: string): string {
    // Generate embed-friendly URL for iframe
    return 'https://meet.google.com/new?authuser=0&hl=en';
  }
}

export default GoogleMeetService;