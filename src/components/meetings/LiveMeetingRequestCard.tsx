import React from 'react';
import { Clock, Users, MapPin, MessageSquare, CheckCircle, XCircle, AlertCircle, User, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LiveMeetingRequest, URGENCY_CONFIGS, PURPOSE_CONFIGS } from '@/types/liveMeeting';

interface LiveMeetingRequestCardProps {
  request: LiveMeetingRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  currentUserRole?: string;
}

export const LiveMeetingRequestCard: React.FC<LiveMeetingRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  currentUserRole = 'employee'
}) => {
  const urgencyConfig = (URGENCY_CONFIGS as any)[request.urgency];
  const purposeConfig = (PURPOSE_CONFIGS as any)[request.purpose];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatTimeUntilExpiry = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));

    if (diffInMinutes <= 0) return 'Expired';
    if (diffInMinutes < 60) return `${diffInMinutes}m left`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h left`;
    return `${Math.floor(diffInMinutes / 1440)}d left`;
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUrgencyBadgeVariant = () => {
    switch (request.urgency) {
      case 'immediate':
        return 'destructive';
      case 'urgent':
        return 'default';
      case 'normal':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const isExpired = new Date() > request.expiresAt;
  const timeUntilExpiry = formatTimeUntilExpiry(request.expiresAt);

  return (
    <Card className={`transition-all hover:shadow-md ${request.urgency === 'immediate' ? 'border-red-200 bg-red-50/50' :
      request.urgency === 'urgent' ? 'border-orange-200 bg-orange-50/50' :
        'border-gray-200'
      }`}>
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1 w-full sm:w-auto">
            <CardTitle className="text-lg flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {request.documentTitle}
              </div>
              <Badge variant="outline" className="text-xs">
                {request.documentType.toUpperCase()}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>From: {request.requesterName} • {request.requesterRole.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-2">
            <Badge variant="default" className="bg-orange-100 text-orange-800">
              ⚡Urgent
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              10m ago
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
        {/* Meeting Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="font-medium min-w-[60px]">Purpose:</span>
              <span>❓Need Clarification</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="font-medium min-w-[60px]">Format:</span>
              <span>
                {request.meetingFormat === 'online' ? '💻 Online' :
                  request.meetingFormat === 'in_person' ? '🏢 In-Person' :
                    '🔄 Hybrid'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Preferred Date & Time:</span>
            </div>
            <div className="ml-6 text-sm space-y-0.5">
              <div><span className="font-medium">Date:</span> 09/26/2025</div>
              <div><span className="font-medium">Time:</span> 10:56 AM</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Expires:</span>
              <span className="text-orange-500">1h Left</span>
            </div>
          </div>
        </div>

        {/* Agenda */}
        {request.agenda && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-1">Agenda/Context:</h4>
            <p className="text-sm text-gray-700">{request.agenda}</p>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-gray-500">
            Request ID: {request.id.slice(-8)}
          </div>

          {request.status === 'pending' && !isExpired && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecline(request.id)}
                className="text-red-600 hover:bg-red-50 w-full sm:w-auto order-2 sm:order-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(request.id)}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto order-1 sm:order-2"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          )}


          {request.status === 'accepted' && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                ✅ Accepted
              </Badge>
              {request.meetingLink && (
                <Button size="sm" variant="outline" asChild>
                  <a href={request.meetingLink} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              )}
            </div>
          )}

          {(request.status === 'rejected' || isExpired) && (
            <Badge variant="secondary" className="text-gray-600">
              {isExpired ? '⏰ Expired' : '❌ Declined'}
            </Badge>
          )}

          {request.status === 'completed' && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              ✅ Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
