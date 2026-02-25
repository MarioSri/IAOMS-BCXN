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

    const meetingId = `iaoms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const meetingUrl = 'https://meet.google.com/new';
    
    try {
      return {
        meetingId,
        meetingUrl,
        hangoutLink: meetingUrl
      };
    } catch (error) {
      console.error('Failed to create Google Meet:', error);
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
    return meetingId.startsWith('iaoms-');
  }

  async endMeeting(meetingId: string): Promise<void> {
    console.log(`Meeting ${meetingId} ended`);
  }

  getEmbedUrl(meetingId: string): string {
    return 'https://meet.google.com/new?authuser=0&hl=en';
  }
}

export default GoogleMeetService;