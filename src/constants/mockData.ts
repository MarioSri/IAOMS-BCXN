export const MOCK_APPROVALS = [
  {
    id: 'faculty-meeting',
    title: 'Faculty Meeting Minutes – Q4 2024',
    type: 'Circular',
    submitter: 'Dr. Sarah Johnson',
    submittedDate: '2024-01-15',
    priority: 'high',
    description: 'Add a risk-mitigation section to highlight potential delays or issues.',
    recipients: ['Employee', 'Principal', 'HOD', 'Registrar'],
    recipientIds: ['employee', 'principal', 'hod', 'registrar']
  },
  {
    id: 'budget-request',
    title: 'Budget Request – Lab Equipment',
    type: 'Letter',
    submitter: 'Prof. David Brown',
    submittedDate: '2024-01-13',
    priority: 'medium',
    description: 'Consider revising the scope to focus on priority items within this quarter\'s budget.',
    recipients: ['Employee', 'Principal', 'HOD'],
    recipientIds: ['employee', 'principal', 'hod']
  },
  {
    id: 'student-event',
    title: 'Student Event Proposal – Tech Fest 2024',
    type: 'Circular',
    submitter: 'Dr. Emily Davis',
    submittedDate: '2024-01-14',
    priority: 'medium',
    description: 'Annual technology festival proposal including budget allocation, venue requirements, and guest speaker arrangements.',
    recipients: ['Employee', 'Principal', 'Registrar'],
    recipientIds: ['employee', 'principal', 'registrar'],
    isEmergency: true
  },
  {
    id: 'research-methodology',
    title: 'Research Methodology Guidelines – Academic Review',
    type: 'Report',
    submitter: 'Prof. Jessica Chen',
    submittedDate: '2024-01-20',
    priority: 'normal',
    description: 'Comprehensive guidelines for research methodology standards and academic review processes.',
    recipients: ['Employee', 'Principal', 'HOD', 'Registrar'],
    recipientIds: ['employee', 'principal', 'hod', 'registrar']
  }
];

export const MOCK_APPROVAL_HISTORY = [
  {
    id: 10,
    title: "Academic Standards Review Report",
    type: "Letter",
    submitter: "Prof. Jessica Chen",
    submittedDate: "2024-01-18",
    status: "approved",
    priority: "normal",
    approvedBy: "Principal",
    approvedDate: "2024-01-19",
    description: "Comprehensive review of academic standards and quality assurance measures across all departments",
    comment: "Academic standards review approved. Implementation timeline is realistic and quality metrics are well-defined."
  },
  {
    id: 9,
    title: "Infrastructure Upgrade Request",
    type: "Proposal",
    submitter: "IT Department",
    submittedDate: "2024-01-16",
    status: "approved",
    priority: "high",
    approvedBy: "Principal",
    approvedDate: "2024-01-17",
    description: "Request for upgrading campus network infrastructure and server capacity to support increased digital learning initiatives",
    comment: "Critical infrastructure upgrade approved. The proposed timeline and phased implementation approach will minimize disruption to ongoing activities. Budget allocation confirmed from IT modernization fund."
  },
  {
    id: 6,
    title: "Research Grant Application",
    type: "Report",
    submitter: "Dr. Michael Anderson",
    submittedDate: "2024-01-10",
    status: "approved",
    priority: "high",
    approvedBy: "Principal",
    approvedDate: "2024-01-12",
    description: "Application for NSF research funding for AI in education project",
    comment: "Excellent proposal with clear objectives and realistic timeline. The budget allocation is well-justified and the expected outcomes align with institutional goals."
  },
  {
    id: 7,
    title: "Event Permission Request",
    type: "Letter",
    submitter: "Prof. Lisa Thompson",
    submittedDate: "2024-01-09",
    status: "rejected",
    rejectedBy: "HOD - CSE",
    rejectedDate: "2024-01-11",
    priority: "medium",
    reason: "Insufficient documentation",
    description: "Permission request for annual tech symposium with external speakers",
    comment: "Please provide detailed speaker profiles, venue safety certificates, and revised budget breakdown before resubmission."
  },
  {
    id: 8,
    title: "Course Curriculum Update",
    type: "Circular",
    submitter: "Dr. Emily Chen",
    submittedDate: "2024-01-08",
    status: "approved",
    priority: "normal",
    approvedBy: "Academic Committee",
    approvedDate: "2024-01-10",
    description: "Proposal to update computer science curriculum with modern AI and machine learning modules",
    comment: "Well-structured curriculum update that addresses current industry needs. Implementation timeline is reasonable and faculty training plan is comprehensive."
  }
];

export const MOCK_MESSAGES_DATA = {
  meetings: [
    { id: 'team-standup', title: 'Daily Team Standup', description: 'Daily sync at 9:00 AM' },
    { id: 'client-review', title: 'Client Quarterly Review Meeting', description: 'Quarterly business review' },
    { id: 'product-planning', title: 'Product Roadmap Planning Session', description: 'Roadmap discussion' },
    { id: 'all-hands', title: 'Monthly All Hands Meeting', description: 'Company updates' }
  ],
  reminders: [
    { id: 'project-deadline', title: 'Project Milestone Deadline', description: 'Due tomorrow' },
    { id: 'client-followup', title: 'Client Follow-up Call Reminder', description: 'Schedule for next week' },
    { id: 'performance-review', title: 'Annual Performance Review Due', description: 'Submit by Friday' },
    { id: 'contract-renewal', title: 'Contract Renewal Reminder', description: 'Review terms' }
  ],
  stickyNotes: [
    { id: 'contract-review', title: 'Review Legal Contract Terms', description: 'Legal feedback needed' },
    { id: 'timeline-update', title: 'Update Project Timeline', description: 'Adjust milestones' },
    { id: 'presentation-prep', title: 'Prepare Board Presentation', description: 'Board meeting prep' },
    { id: 'budget-analysis', title: 'Complete Budget Analysis', description: 'Financial review' }
  ],
  channels: [
    { id: 'engineering', name: 'Engineering Team', description: '24 members online' },
    { id: 'marketing', name: 'Marketing Department', description: '18 members online' },
    { id: 'general', name: 'General Discussion', description: '45 members online' },
    { id: 'product', name: 'Product Updates', description: '32 members online' },
    { id: 'hr', name: 'HR Announcements', description: '67 members online' }
  ]
};

export const MOCK_ANALYTICS_DATA = {
  departmentStats: [
    { name: "Computer Science", submitted: 45, approved: 38, rejected: 7, pending: 0 },
    { name: "Electrical Engineering", submitted: 32, approved: 28, rejected: 2, pending: 2 },
    { name: "Mechanical Engineering", submitted: 28, approved: 24, rejected: 3, pending: 1 },
    { name: "Electronics & Communication", submitted: 35, approved: 30, rejected: 4, pending: 1 },
    { name: "Civil Engineering", submitted: 22, approved: 20, rejected: 1, pending: 1 }
  ],
  monthlyTrends: [
    { month: "Oct", documents: 120, approved: 98, rejected: 15, avgTime: 2.3 },
    { month: "Nov", documents: 135, approved: 115, rejected: 12, avgTime: 2.1 },
    { month: "Dec", documents: 98, approved: 85, rejected: 8, avgTime: 1.9 },
    { month: "Jan", documents: 162, approved: 140, rejected: 17, avgTime: 2.2 }
  ]
};

export const MOCK_MESSAGE_STATS = {
  unreadMessages: 26,
  activePolls: 1,
  onlineUsers: 23,
  totalChannels: 5,
  notifications: 4,
  liveMeetingRequests: 3
};

export const MOCK_CHANNEL_COUNTS = {
  'Administrative Council': 9,
  'Faculty Board': 5,
  'General': 12
};
