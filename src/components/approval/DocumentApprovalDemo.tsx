import React, { useState } from 'react';
import { FileText, User, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LiveMeetingRequestModal } from '@/components/meetings/LiveMeetingRequestModal';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  title: string;
  type: 'letter' | 'circular' | 'report';
  description: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  content: string;
  attachments?: string[];
}

interface DocumentApprovalCardProps {
  document: Document;
  onApprove?: (documentId: string) => void;
  onReject?: (documentId: string) => void;
}

export const DocumentApprovalCard: React.FC<DocumentApprovalCardProps> = ({
  document,
  onApprove,
  onReject
}) => {
  const [showLiveMeetingModal, setShowLiveMeetingModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleApprove = () => {
    onApprove?.(document.id);
    toast({
      title: "Document Approved",
      description: `${document.title} has been approved successfully.`,
      variant: "default"
    });
  };

  const handleReject = () => {
    onReject?.(document.id);
    toast({
      title: "Document Rejected",
      description: `${document.title} has been rejected.`,
      variant: "default"
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'letter': return '📄';
      case 'circular': return '📋';
      case 'report': return '📊';
      default: return '📄';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{getTypeIcon(document.type)}</span>
                {document.title}
                <Badge variant="outline" className="text-xs">
                  {document.type.toUpperCase()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600">{document.description}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={getPriorityColor(document.priority)}>
                {document.priority.toUpperCase()} PRIORITY
              </Badge>
              <div className="text-xs text-gray-500">
                ID: {document.id.slice(-8)}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Document Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Submitted by:</span>
                <span>{document.submittedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Role:</span>
                <span>{document.submittedByRole}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Submitted:</span>
                <span>{formatDate(document.submittedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={document.status === 'pending' ? 'default' : 'secondary'}>
                  {document.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Document Preview */}
          {showPreview && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Document Content:</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {document.content}
              </p>
            </div>
          )}

          {/* Attachments */}
          {document.attachments && document.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Attachments:</h4>
              <div className="flex flex-wrap gap-2">
                {document.attachments.map((attachment, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    📎 {attachment}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Preview'}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {document.status === 'pending' && (
                <>
                  <Button
                    onClick={handleApprove}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="destructive"
                    className="flex items-center gap-1"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>

                  {/* NEW: Live Meeting Request Button */}
                  <Button
                    onClick={() => setShowLiveMeetingModal(true)}
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50 flex items-center gap-1"
                    size="sm"
                  >
                    🔴 LiveMeet+
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Meeting Request Modal */}
      <LiveMeetingRequestModal
        isOpen={showLiveMeetingModal}
        onClose={() => setShowLiveMeetingModal(false)}
        documentId={document.id}
        documentType={document.type}
        documentTitle={document.title}
      />
    </>
  );
};

// Demo component with sample documents
export const DocumentApprovalDemo: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'doc_001',
      title: 'New Academic Policy Update',
      type: 'circular',
      description: 'Updated grading policy for the upcoming semester',
      submittedBy: 'Dr. Sarah Johnson',
      submittedByRole: 'Head of Academics',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      priority: 'high',
      status: 'pending',
      content: `Dear Faculty and Staff,

This circular outlines the new academic policy changes effective from the next semester:

1. Continuous Assessment: 40% weightage
2. Mid-term Examination: 25% weightage  
3. Final Examination: 35% weightage

The policy aims to provide a more balanced assessment approach and reduce the stress of final examinations.

Please review and provide your feedback by the end of this week.

Best regards,
Academic Committee`,
      attachments: ['policy_document.pdf', 'implementation_guide.docx']
    },
    {
      id: 'doc_002',
      title: 'Department Budget Allocation Report Q3',
      type: 'report',
      description: 'Quarterly budget allocation and expenditure report',
      submittedBy: 'Prof. Michael Chen',
      submittedByRole: 'HOD Computer Science',
      submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      priority: 'medium',
      status: 'pending',
      content: `Q3 Budget Report - Computer Science Department

Total Allocated Budget: $250,000
Total Expenditure: $187,500
Remaining Budget: $62,500

Major Expenditures:
- Equipment Purchase: $95,000
- Faculty Development: $35,000
- Research Grants: $42,500
- Infrastructure: $15,000

The department has successfully managed expenses within budget while achieving all quarterly objectives.`,
      attachments: ['budget_report.xlsx', 'expenditure_breakdown.pdf']
    },
    {
      id: 'doc_003',
      title: 'Student Placement Drive Proposal',
      type: 'letter',
      description: 'Proposal for organizing placement drive for final year students',
      submittedBy: 'Ms. Emily Rodriguez',
      submittedByRole: 'Placement Officer',
      submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      priority: 'low',
      status: 'pending',
      content: `Dear Principal,

I am writing to propose organizing a comprehensive placement drive for our final year students scheduled for next month.

Proposal Details:
- Duration: 5 days
- Expected Companies: 25-30
- Target Students: 450+
- Estimated Budget: $15,000

The placement drive will include pre-placement talks, technical rounds, HR interviews, and immediate offer letters for selected candidates.

I request your approval to proceed with the arrangements.

Sincerely,
Emily Rodriguez`,
      attachments: ['company_list.pdf', 'budget_estimate.xlsx']
    }
  ]);

  const handleApprove = (documentId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId
          ? { ...doc, status: 'approved' as const }
          : doc
      )
    );
  };

  const handleReject = (documentId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId
          ? { ...doc, status: 'rejected' as const }
          : doc
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Approval Workflow</h2>
        <p className="text-gray-600">
          Review and approve pending documents. Use "LiveMeet+" for immediate clarification.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map(document => (
          <DocumentApprovalCard
            key={document.id}
            document={document}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
};
