import {
  LiveMeetingRequest,
  CreateLiveMeetingRequestDto,
  LiveMeetingResponse,
  LiveMeetingStats,
  URGENCY_CONFIGS,
  LIVE_MEETING_PERMISSIONS
} from '../types/liveMeeting';

// Mock data for recipients (shared with AuthContext)
const MOCK_PARTICIPANTS = [
  { id: 'principal-1', name: 'Dr. Robert Principal', role: 'principal', email: 'principal@institution.edu', department: 'Administration' },
  { id: 'registrar-1', name: 'Prof. Sarah Registrar', role: 'registrar', email: 'registrar@institution.edu', department: 'Administration' },
  { id: 'hod-cs', name: 'Dr. Maria HOD', role: 'hod', email: 'hod.cs@institution.edu', department: 'Computer Science' },
  { id: 'hod-ee', name: 'Dr. James HOD', role: 'hod', email: 'hod.ee@institution.edu', department: 'Electrical Engineering' }
];

class LiveMeetingService {
  private isDevelopment = true; // Force development mode for localStorage/mock logic

  // Create a new live meeting request
  async createRequest(requestData: CreateLiveMeetingRequestDto): Promise<LiveMeetingRequest> {
    const urgencyConfig = URGENCY_CONFIGS[requestData.urgency];
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + urgencyConfig.expiresInMinutes);

    const request: LiveMeetingRequest = {
      id: `live_req_${Date.now()}`,
      type: 'live_communication_request',
      documentId: requestData.documentId,
      documentType: requestData.documentType,
      documentTitle: requestData.documentTitle,
      requesterId: 'current_user_id',
      requesterName: 'Current User',
      requesterRole: 'employee',
      targetUserId: requestData.targetUserIds[0],
      targetUserName: 'Target User',
      targetUserRole: 'principal',
      urgency: requestData.urgency,
      meetingFormat: requestData.meetingFormat,
      purpose: requestData.purpose,
      agenda: requestData.agenda,
      requestedTime: requestData.requestedTime,
      location: requestData.location,
      status: 'pending',
      participants: requestData.targetUserIds.map((userId, index) => ({
        id: `participant_${index}`,
        userId,
        userName: `User ${index + 1}`,
        role: 'principal',
        email: `user${index + 1}@institution.edu`,
        status: 'invited' as const
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt
    };

    // Save to localStorage
    const existingRequests = JSON.parse(localStorage.getItem('live_meeting_requests') || '[]');
    existingRequests.push(request);
    localStorage.setItem('live_meeting_requests', JSON.stringify(existingRequests));

    console.log('Created live meeting request:', request);
    return request;
  }

  // Respond to a live meeting request
  async respondToRequest(response: LiveMeetingResponse): Promise<void> {
    const requests = JSON.parse(localStorage.getItem('live_meeting_requests') || '[]');
    const updatedRequests = requests.map((req: LiveMeetingRequest) => {
      if (req.id === response.requestId) {
        return {
          ...req,
          status: response.response === 'accept' ? 'accepted' : 'rejected',
          meetingLink: response.response === 'accept' ? `https://meet.google.com/mock-${Date.now()}` : undefined,
          updatedAt: new Date()
        };
      }
      return req;
    });
    localStorage.setItem('live_meeting_requests', JSON.stringify(updatedRequests));

    console.log('Responded to live meeting request:', response);
  }

  // Get live meeting requests for current user
  async getMyRequests(filter?: 'pending' | 'urgent' | 'immediate' | 'all'): Promise<LiveMeetingRequest[]> {
    const requests = JSON.parse(localStorage.getItem('live_meeting_requests') || '[]');

    if (filter && filter !== 'all') {
      return requests.filter((req: LiveMeetingRequest) => {
        switch (filter) {
          case 'pending':
            return req.status === 'pending';
          case 'urgent':
            return req.urgency === 'urgent';
          case 'immediate':
            return req.urgency === 'immediate';
          default:
            return true;
        }
      });
    }

    return requests;
  }

  // Get live meeting stats
  async getStats(userRole?: string): Promise<LiveMeetingStats> {
    const requests = JSON.parse(localStorage.getItem('live_meeting_requests') || '[]');

    // Check if user is demo-work role
    const isDemoRole = userRole === 'demo-work';

    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter((r: LiveMeetingRequest) => r.status === 'pending').length,
      immediateRequests: requests.filter((r: LiveMeetingRequest) => r.urgency === 'immediate').length,
      urgentRequests: requests.filter((r: LiveMeetingRequest) => r.urgency === 'urgent').length,
      todaysMeetings: isDemoRole ? 8 : 0,
      successRate: 94,
      averageResponseTime: 12 // minutes
    };
  }

  // Check if user can request meeting from target user
  canRequestMeeting(userRole: string, targetUserRole: string): boolean {
    const allowedRoles = LIVE_MEETING_PERMISSIONS[userRole] || [];
    return allowedRoles.includes(targetUserRole) || allowedRoles.includes('all');
  }

  // Get available participants based on current user role
  async getAvailableParticipants(currentUserRole: string): Promise<typeof MOCK_PARTICIPANTS> {
    const allowedRoles = LIVE_MEETING_PERMISSIONS[currentUserRole] || [];

    return MOCK_PARTICIPANTS
      .filter(user =>
        allowedRoles.includes(user.role) || allowedRoles.includes('all')
      );
  }
}

export const liveMeetingService = new LiveMeetingService();
