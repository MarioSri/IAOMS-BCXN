import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { isUserInRecipients } from '@/utils/recipientMatching';

export const ApprovalDebugger: React.FC = () => {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    loadApprovalCards();
  }, []);

  const loadApprovalCards = () => {
    const stored = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
    setPendingApprovals(stored);
    
    let info = `📊 Debug Information:\n`;
    info += `👤 Current User: ${user?.name} (${user?.role})\n`;
    info += `📋 Total Cards in Storage: ${stored.length}\n\n`;
    
    stored.forEach((doc: any, index: number) => {
      const shouldShow = isUserInRecipients({
        user: {
          name: user?.name,
          role: user?.role,
          department: user?.department,
          branch: user?.branch
        },
        recipients: doc.recipients,
        recipientIds: doc.recipientIds,
        workflowSteps: doc.workflow?.steps
      });
      
      info += `${index + 1}. "${doc.title}"\n`;
      info += `   Recipients: ${JSON.stringify(doc.recipients || [])}\n`;
      info += `   Recipient IDs: ${JSON.stringify(doc.recipientIds || [])}\n`;
      info += `   Should Show: ${shouldShow ? '✅ YES' : '❌ NO'}\n`;
      info += `   Source: ${doc.source || 'N/A'}\n`;
      info += `   Is Parallel: ${doc.isParallel || false}\n\n`;
    });
    
    setDebugInfo(info);
  };

  const createTestCard = () => {
    const testCard = {
      id: 'debug-test-' + Date.now(),
      title: `Test Card for ${user?.role}`,
      type: 'Letter',
      submitter: 'Debug Tool',
      submittedDate: new Date().toISOString().split('T')[0],
      priority: 'high',
      description: 'Test card created by debug tool',
      recipients: [user?.name],
      recipientIds: [user?.role?.toLowerCase() + '-' + (user?.name || '').toLowerCase().replace(/\s+/g, '-')],
      isEmergency: false,
      isParallel: false,
      source: 'debug'
    };

    const existing = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
    const updated = [...existing, testCard];
    localStorage.setItem('pending-approvals', JSON.stringify(updated));
    
    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pending-approvals',
      newValue: JSON.stringify(updated)
    }));
    
    loadApprovalCards();
  };

  const clearTestCards = () => {
    const existing = JSON.parse(localStorage.getItem('pending-approvals') || '[]');
    const filtered = existing.filter((card: any) => !card.id.startsWith('debug-test-'));
    localStorage.setItem('pending-approvals', JSON.stringify(filtered));
    
    // Trigger storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pending-approvals',
      newValue: JSON.stringify(filtered)
    }));
    
    loadApprovalCards();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Approval Cards Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={loadApprovalCards} variant="outline">
            Refresh
          </Button>
          <Button onClick={createTestCard} variant="outline">
            Create Test Card
          </Button>
          <Button onClick={clearTestCards} variant="outline">
            Clear Test Cards
          </Button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Cards in Storage:</h3>
          {pendingApprovals.map((doc, index) => {
            const shouldShow = isUserInRecipients({
              user: {
                name: user?.name,
                role: user?.role,
                department: user?.department,
                branch: user?.branch
              },
              recipients: doc.recipients,
              recipientIds: doc.recipientIds,
              workflowSteps: doc.workflow?.steps
            });
            
            return (
              <Card key={doc.id} className={shouldShow ? 'border-green-500' : 'border-red-500'}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{doc.title}</h4>
                      <p className="text-sm text-gray-600">ID: {doc.id}</p>
                      <p className="text-sm text-gray-600">Recipients: {JSON.stringify(doc.recipients || [])}</p>
                      <p className="text-sm text-gray-600">Recipient IDs: {JSON.stringify(doc.recipientIds || [])}</p>
                    </div>
                    <Badge variant={shouldShow ? "default" : "destructive"}>
                      {shouldShow ? "VISIBLE" : "HIDDEN"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApprovalDebugger;