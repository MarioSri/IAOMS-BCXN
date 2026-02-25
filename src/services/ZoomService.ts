export class ZoomService {
  private static instance: ZoomService;
  private accountId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.accountId = '2LFdPfHkQ8SNBLeqr3u6VQ';
    this.clientId = 'cHyoPrqZQfy2obniYbmzfw';
    this.clientSecret = '8u4EjbdUC1LSkxaCHqSh2IK0X7kxNAHb';
  }

  static getInstance(): ZoomService {
    if (!ZoomService.instance) {
      ZoomService.instance = new ZoomService();
    }
    return ZoomService.instance;
  }

  async createMeeting(options: {
    title: string;
    description?: string;
    startTime: Date;
    duration: number;
    attendees?: string[];
  }): Promise<{
    meetingId: string;
    joinUrl: string;
    startUrl: string;
    password?: string;
  }> {
    try {
      const meetingId = `zoom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const joinUrl = 'https://zoom.us/start/webmeeting';
      
      return {
        meetingId,
        joinUrl,
        startUrl: joinUrl,
        password: undefined
      };
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      throw error;
    }
  }

  generateMeetingId(): string {
    return `zoom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getInstantMeetingUrl(): string {
    return 'https://zoom.us/start/webmeeting';
  }

  async validateMeeting(meetingId: string): Promise<boolean> {
    return meetingId.startsWith('zoom-');
  }

  async endMeeting(meetingId: string): Promise<void> {
    console.log(`Zoom meeting ${meetingId} ended`);
  }
}

export default ZoomService;