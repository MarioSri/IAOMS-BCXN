import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DocumentWorkflowIntegration, DocumentWorkflowEvent } from '@/services/DocumentWorkflowIntegration';
import { DecentralizedChatService } from '@/services/DecentralizedChatService';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  Users,
  ArrowRight,
  Zap,
  MessageSquare
} from 'lucide-react';

export const WorkflowDemo: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowIntegration, setWorkflowIntegration] = useState<DocumentWorkflowIntegration | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Demo document form
  const [documentTitle, setDocumentTitle] = useState('Sample Academic Letter');
  const [documentType, setDocumentType] = useState<'letter' | 'circular' | 'report' | 'form' | 'approval'>('letter');
  const [documentDescription, setDocumentDescription] = useState('This is a demonstration of the document workflow integration with the chat system.');
  const [approvers, setApprovers] = useState('hod-001,registrar-001');

  // Demo events
  const [events, setEvents] = useState<DocumentWorkflowEvent[]>([]);

  useEffect(() => {
    // Initialize the workflow integration
    const chatService = new DecentralizedChatService(
      import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
      import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    );

    const integration = new DocumentWorkflowIntegration(chatService);
    setWorkflowIntegration(integration);

    return () => {
      chatService.disconnect();
    };
  }, []);

  const generateDocumentId = () => {
    return 'doc-' + Math.random().toString(36).substr(2, 9);
  };

  const createDocumentEvent = (type: DocumentWorkflowEvent['type'], documentId: string): DocumentWorkflowEvent => {
    return {
      id: 'event-' + Math.random().toString(36).substr(2, 9),
      type,
      documentId,
      documentType,
      title: documentTitle,
      description: documentDescription,
      userId: user?.id || 'demo-user',
      recipientIds: approvers.split(',').map(id => id.trim()).filter(Boolean),
      createdAt: new Date(),
      metadata: {
        fileType: 'application/pdf',
        fileSize: 1024 * 150, // 150KB
        fileUrl: `/documents/${documentId}.pdf`,
        version: '1.0'
      }
    };
  };

  const simulateWorkflowStep = async (step: DocumentWorkflowEvent['type']) => {
    if (!workflowIntegration || !user) return;

    setIsProcessing(true);
    try {
      const documentId = generateDocumentId();
      const event = createDocumentEvent(step, documentId);

      // Add to events list
      setEvents(prev => [...prev, event]);

      // Process the event through the integration
      await workflowIntegration.processWorkflowEvent(event);

      toast({
        title: 'Workflow Step Completed',
        description: `${step.replace('_', ' ').toUpperCase()} event processed successfully`,
        variant: 'default'
      });

      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Workflow step error:', error);
      toast({
        title: 'Workflow Error',
        description: 'Failed to process workflow step',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const workflowSteps = [
    {
      type: 'document_created' as const,
      title: 'Create Document',
      description: 'Document is created and discussion channel is set up',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      type: 'approval_requested' as const,
      title: 'Request Approval',
      description: 'Approval workflow is initiated with designated approvers',
      icon: Clock,
      color: 'bg-orange-500'
    },
    {
      type: 'document_shared' as const,
      title: 'Share Document',
      description: 'Document is shared with stakeholders via chat',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      type: 'approval_completed' as const,
      title: 'Complete Approval',
      description: 'Approval process is completed and notifications sent',
      icon: CheckCircle,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Document Workflow Integration Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Demonstrate how document workflows integrate with the chat & communication system
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Document Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Document Type</Label>
              <select
                id="type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as any)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                aria-label="Select document type"
              >
                <option value="letter">Letter</option>
                <option value="circular">Circular</option>
                <option value="report">Report</option>
                <option value="form">Form</option>
                <option value="approval">Approval</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Enter document description"
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="approvers">Approvers (comma-separated user IDs)</Label>
              <Input
                id="approvers"
                value={approvers}
                onChange={(e) => setApprovers(e.target.value)}
                placeholder="e.g., hod-001, registrar-001, principal-001"
              />
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Workflow Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowSteps.map((step, index) => (
                <Card key={step.type} className="relative">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${step.color} text-white`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary">{index + 1}</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>

                    <Button
                      onClick={() => simulateWorkflowStep(step.type)}
                      disabled={isProcessing}
                      size="sm"
                      className="w-full"
                    >
                      {isProcessing ? (
                        'Processing...'
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" />
                          Simulate
                        </>
                      )}
                    </Button>
                  </CardContent>

                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Event Log */}
          {events.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Workflow Events
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {events.slice().reverse().map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          {event.type.replace('_', ' ').toUpperCase()}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {event.documentType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.createdAt.toLocaleTimeString()} • Document ID: {event.documentId.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Status */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Workflow Integration</span>
            </div>
            <Badge variant={workflowIntegration ? "default" : "destructive"}>
              {workflowIntegration ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🚀 Getting Started</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Configure your document details above</li>
                <li>• Click "Simulate" on any workflow step</li>
                <li>• Check the Chat tab to see generated channels</li>
                <li>• View automatic notifications and messages</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">⚡ Features Demonstrated</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic channel creation for documents</li>
                <li>• Approval workflow integration</li>
                <li>• Real-time notifications</li>
                <li>• Document sharing via chat</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm">
              <strong>💡 Pro Tip:</strong> In a real implementation, these workflow events would be
              triggered automatically by the document management system when users create, share,
              or request approvals for documents.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDemo;
