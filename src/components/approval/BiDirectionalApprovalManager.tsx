import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BiDirectionalWorkflowEngine } from '@/services/BiDirectionalWorkflowEngine';
import { WorkflowInstance, WorkflowAction } from '@/types/workflow';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  MessageSquare,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface BiDirectionalApprovalManagerProps {
  className?: string;
}

export const BiDirectionalApprovalManager: React.FC<BiDirectionalApprovalManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowEngine] = useState(() => new BiDirectionalWorkflowEngine());
  const [pendingApprovals, setPendingApprovals] = useState<WorkflowInstance[]>([]);
  const [myInstances, setMyInstances] = useState<WorkflowInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate' | 'request-changes' | null>(null);
  const [comments, setComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCounterApproval, setShowCounterApproval] = useState(false);

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Set up timeout checking interval
      const timeoutInterval = setInterval(() => {
        workflowEngine.checkTimeouts();
        refreshData();
      }, 60000); // Check every minute

      return () => clearInterval(timeoutInterval);
    }
  }, [user]);

  const refreshData = () => {
    if (!user) return;
    
    const pending = workflowEngine.getPendingApprovals(user.id);
    const instances = workflowEngine.getInstancesByUser(user.id);
    
    setPendingApprovals(pending);
    setMyInstances(instances);
  };

  const handleAction = async (instance: WorkflowInstance, action: 'approve' | 'reject' | 'escalate' | 'request-changes') => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      const result = workflowEngine.processApproval(
        instance.id,
        instance.currentStepId,
        action,
        user.id,
        comments
      );

      if (result.success) {
        toast({
          title: 'Action Processed',
          description: result.message,
          variant: 'default'
        });

        // Check if counter-approval is needed
        if (action === 'approve' && result.message.includes('Counter-approval required')) {
          setShowCounterApproval(true);
        }

        refreshData();
        setSelectedInstance(null);
        setActionType(null);
        setComments('');
      } else {
        toast({
          title: 'Action Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while processing the action',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCounterApproval = async (instance: WorkflowInstance, originalActionId: string, action: 'counter-approve' | 'reject') => {
    if (!user) return;
    
    setIsProcessing(true);
    
    try {
      const result = workflowEngine.processCounterApproval(
        instance.id,
        originalActionId,
        action,
        user.id,
        comments
      );

      if (result.success) {
        toast({
          title: 'Counter-Approval Processed',
          description: result.message,
          variant: 'default'
        });

        refreshData();
        setShowCounterApproval(false);
        setComments('');
      } else {
        toast({
          title: 'Counter-Approval Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while processing counter-approval',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'escalated': return <ArrowUpCircle className="w-5 h-5 text-orange-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reject': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'escalate': return <ArrowUpCircle className="w-4 h-4 text-orange-500" />;
      case 'counter-approve': return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeElapsed = (date: Date) => {
    const now = new Date();
    const elapsed = now.getTime() - date.getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const WorkflowInstanceCard: React.FC<{ instance: WorkflowInstance; showActions?: boolean }> = ({ 
    instance, 
    showActions = false 
  }) => {
    const route = workflowEngine.getWorkflowRoute(instance.workflowRouteId);
    const currentStep = route?.steps.find(step => step.id === instance.currentStepId);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(instance.status)}
              <div>
                <CardTitle className="text-lg">{route?.name || 'Unknown Workflow'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Document ID: {instance.documentId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={instance.status === 'completed' ? 'default' : 'secondary'}>
                {instance.status}
              </Badge>
              {currentStep && (
                <Badge variant="outline">
                  {currentStep.name}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Workflow Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Workflow Progress</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                Initiated by: {instance.initiatedBy}
                <Calendar className="w-4 h-4 ml-4" />
                {formatTimeElapsed(instance.initiatedAt)}
              </div>
            </div>

            {/* Recent Actions */}
            {instance.history.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Actions</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {instance.history.slice(-3).reverse().map((action, index) => (
                    <div key={action.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                      {getActionIcon(action.actionType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{action.performedBy}</span>
                          <span className="text-muted-foreground">{action.actionType}</span>
                          {action.isCounterApproval && (
                            <Badge variant="outline" className="text-xs">
                              Counter-Approval
                            </Badge>
                          )}
                        </div>
                        {action.comments && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {action.comments}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatTimeElapsed(action.performedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {showActions && currentStep && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedInstance(instance);
                    setActionType('approve');
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setSelectedInstance(instance);
                    setActionType('reject');
                  }}
                  className="flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedInstance(instance);
                    setActionType('request-changes');
                  }}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Changes
                </Button>
                
                {currentStep.escalationRoles && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelectedInstance(instance);
                      setActionType('escalate');
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Escalate
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bi-Directional Approval Routing</h2>
          <p className="text-muted-foreground">
            Manage document approvals with flexible routing and escalation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {pendingApprovals.length} Pending
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="my-workflows" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            My Workflows ({myInstances.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any documents waiting for your approval at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map(instance => (
                <WorkflowInstanceCard
                  key={instance.id}
                  instance={instance}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-workflows" className="space-y-4">
          {myInstances.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Workflows</h3>
                <p className="text-muted-foreground text-center">
                  You haven't initiated any workflows yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myInstances.map(instance => (
                <WorkflowInstanceCard
                  key={instance.id}
                  instance={instance}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      {selectedInstance && actionType && (
        <AlertDialog open={!!selectedInstance} onOpenChange={() => {
          setSelectedInstance(null);
          setActionType(null);
          setComments('');
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {getActionIcon(actionType)}
                {actionType.charAt(0).toUpperCase() + actionType.slice(1)} Document
              </AlertDialogTitle>
              <AlertDialogDescription>
                Document ID: {selectedInstance.documentId}
                <br />
                Current Step: {workflowEngine.getWorkflowRoute(selectedInstance.workflowRouteId)?.steps.find(s => s.id === selectedInstance.currentStepId)?.name}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Comments {actionType === 'reject' || actionType === 'request-changes' ? '(Required)' : '(Optional)'}
                </label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={`Add comments for your ${actionType} action...`}
                  className="mt-2"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleAction(selectedInstance, actionType)}
                disabled={isProcessing || ((actionType === 'reject' || actionType === 'request-changes') && !comments.trim())}
                className={cn(
                  actionType === 'reject' && 'bg-destructive hover:bg-destructive/90',
                  actionType === 'approve' && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {isProcessing ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Counter-Approval Dialog */}
      {showCounterApproval && selectedInstance && (
        <AlertDialog open={showCounterApproval} onOpenChange={setShowCounterApproval}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Counter-Approval Required
              </AlertDialogTitle>
              <AlertDialogDescription>
                This document has been approved but requires counter-approval before proceeding to the next step.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Counter-Approval Comments (Optional)</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add comments for your counter-approval..."
                  className="mt-2"
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={() => {
                  const lastApproval = selectedInstance.history.find(h => h.actionType === 'approve');
                  if (lastApproval) {
                    handleCounterApproval(selectedInstance, lastApproval.id, 'reject');
                  }
                }}
                disabled={isProcessing}
                className="mr-2"
              >
                Reject Counter-Approval
              </Button>
              <AlertDialogAction
                onClick={() => {
                  const lastApproval = selectedInstance.history.find(h => h.actionType === 'approve');
                  if (lastApproval) {
                    handleCounterApproval(selectedInstance, lastApproval.id, 'counter-approve');
                  }
                }}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Processing...' : 'Counter-Approve'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
