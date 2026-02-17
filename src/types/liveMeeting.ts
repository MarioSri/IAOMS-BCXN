// Live Meeting Request Types - Separate from regular meeting scheduler
export interface LiveMeetingRequest {
  id: string;
  type: 'live_communication_request';
  documentId: string;
  documentType: 'letter' | 'circular' | 'report';
  documentTitle: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: string;
  urgency: 'immediate' | 'urgent' | 'normal';
  meetingFormat: 'in_person' | 'online' | 'hybrid';
  purpose: 'clarification' | 'approval_discussion' | 'document_review' | 'urgent_decision';
  agenda?: string;
  requestedTime?: Date;
  scheduledTime?: Date;
  meetingLink?: string;
  location?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';
  participants: LiveMeetingParticipant[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  response?: string;
  responseTime?: Date;
}

export interface LiveMeetingParticipant {
  id: string;
  userId: string;
  userName: string;
  role: string;
  email: string;
  status: 'invited' | 'accepted' | 'declined' | 'no_response';
  joinedAt?: Date;
  responseTime?: Date;
}

export interface CreateLiveMeetingRequestDto {
  documentId: string;
  documentType: 'letter' | 'circular' | 'report';
  documentTitle: string;
  targetUserIds: string[];
  urgency: 'immediate' | 'urgent' | 'normal';
  meetingFormat: 'in_person' | 'online' | 'hybrid';
  purpose: 'clarification' | 'approval_discussion' | 'document_review' | 'urgent_decision';
  agenda?: string;
  requestedTime?: Date;
  location?: string;
}

export interface LiveMeetingResponse {
  requestId: string;
  response: 'accept' | 'decline';
  message?: string;
  suggestedTime?: Date;
  suggestedLocation?: string;
}

export interface LiveMeetingStats {
  totalRequests: number;
  pendingRequests: number;
  immediateRequests: number;
  urgentRequests: number;
  todaysMeetings: number;
  successRate: number;
  averageResponseTime: number;
}

// Role-based permission matrix for live meeting requests
export interface RolePermissions {
  [key: string]: string[];
}

export const LIVE_MEETING_PERMISSIONS: RolePermissions = {
  // Employees can request from these roles
  'employee': [
    'employee',
    'program_head_eee', 'program_head_mech', 'program_head_cse', 'program_head_ece',
    'program_head_csm', 'program_head_cso', 'program_head_csd', 'program_head_csc',
    'hod_eee', 'hod_mech', 'hod_cse', 'hod_ece', 'hod_csm', 'hod_cso', 'hod_csd', 'hod_csc',
    'registrar', 'principal'
  ],
  'faculty': [
    'program_head_eee', 'program_head_mech', 'program_head_cse', 'program_head_ece',
    'program_head_csm', 'program_head_cso', 'program_head_csd', 'program_head_csc',
    'hod_eee', 'hod_mech', 'hod_cse', 'hod_ece', 'hod_csm', 'hod_cso', 'hod_csd', 'hod_csc',
    'registrar', 'principal'
  ],
  // Principal can initiate with all roles
  'principal': [
    'employee', 'faculty', 'mentor',
    'program_head_eee', 'program_head_mech', 'program_head_cse', 'program_head_ece',
    'program_head_csm', 'program_head_cso', 'program_head_csd', 'program_head_csc',
    'hod_eee', 'hod_mech', 'hod_cse', 'hod_ece', 'hod_csm', 'hod_cso', 'hod_csd', 'hod_csc',
    'registrar', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership',
    'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'
  ],
  // Program Heads can request from these roles
  'program_head_eee': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_mech': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_cse': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_ece': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_csm': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_cso': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_csd': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'program_head_csc': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  // HODs can request from these roles
  'hod_eee': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_mech': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_cse': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_ece': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_csm': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_cso': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_csd': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  'hod_csc': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg'],
  // Registrar can request from these roles
  'registrar': ['faculty', 'cdc_employee', 'dean', 'chairman', 'director', 'leadership', 'controller_examinations', 'asst_dean_iiic', 'head_operations', 'librarian', 'ssg']
};

// Urgency level configurations
export const URGENCY_CONFIGS = {
  immediate: {
    label: 'Immediate',
    description: 'Within 15 minutes',
    icon: '🔥',
    color: 'red',
    expiresInMinutes: 30,
    notificationInterval: 2 // minutes
  },
  urgent: {
    label: 'Urgent',
    description: 'Within 1 hour',
    icon: '⚡',
    color: 'orange',
    expiresInMinutes: 120,
    notificationInterval: 15 // minutes
  },
  normal: {
    label: 'Normal',
    description: 'Within 4 hours',
    icon: '📅',
    color: 'blue',
    expiresInMinutes: 480,
    notificationInterval: 60 // minutes
  }
};

// Meeting purpose configurations
export const PURPOSE_CONFIGS = {
  clarification: {
    label: 'Need Clarification',
    description: 'Requires clarification on document content',
    icon: '❓'
  },
  approval_discussion: {
    label: 'Approval Discussion',
    description: 'Discussion needed before approval/rejection',
    icon: '📋'
  },
  document_review: {
    label: 'Document Review',
    description: 'Collaborative document review session',
    icon: '📄'
  },
  urgent_decision: {
    label: 'Urgent Decision',
    description: 'Time-sensitive decision required',
    icon: '⚠️'
  }
};
