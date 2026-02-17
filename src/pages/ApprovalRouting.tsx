import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WorkflowConfiguration } from '@/components/workflow/WorkflowConfiguration';
import { ResponsiveLayout } from '@/components/layout/ResponsiveLayout';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Settings,
  Clock,
  CheckCircle2,
  ArrowRightLeft,
  Shield,
  Zap,
  BarChart3,

  Bell,
  TrendingUp,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function ApprovalRouting() {
  const { user } = useAuth();
  const [isBypassMode, setIsBypassMode] = useState(false);
  const stats = {
    pendingApprovals: 12,
    completedToday: 8,
    averageTime: '2.3 hours',
    escalationRate: '5%',
    counterApprovals: 3
  };

  const features = [
    {
      icon: ArrowRightLeft,
      title: 'Bi-Directional Routing',
      description: 'Dynamic approval paths that adapt based on document type, department, and business rules',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Counter-Approval System',
      description: 'Additional verification layer where designated users can validate critical decisions',
      color: 'text-green-500'
    },
    {
      icon: Clock,
      title: 'Auto-Escalation',
      description: 'Smart escalation system: timeout-based escalation cycles through recipients and returns to original approver, rejection-based escalation (2+ rejections) moves to higher authority, single rejection stops the process',
      color: 'text-orange-500'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Context-aware notifications with configurable priority levels and delivery methods',
      color: 'text-purple-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Comprehensive insights into approval bottlenecks, completion times, and process efficiency',
      color: 'text-indigo-500'
    },
    {
      icon: Zap,
      title: 'Role-Based Rules',
      description: 'Flexible rule engine that routes documents based on user roles, departments, and custom criteria',
      color: 'text-yellow-500'
    }
  ];

  const ADMIN_ROLES = ['principal', 'registrar', 'hod', 'program-head'];
  const isAdmin = user ? ADMIN_ROLES.includes(user.role) : false;

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <Card className={`shadow-elegant ${isBypassMode ? 'border-green-500 bg-green-50' : ''}`}>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className={`w-6 h-6 ${isBypassMode ? 'text-green-600 animate-pulse' : 'text-primary'}`} />
                <span className="text-xl sm:text-2xl">Approval Chain with Bypass</span>
              </CardTitle>

              <Button
                onClick={() => setIsBypassMode(!isBypassMode)}
                variant={isBypassMode ? "default" : "outline"}
                className={`w-full sm:w-auto font-bold ${isBypassMode ? 'animate-pulse shadow-glow bg-green-600 hover:bg-green-700 text-white' : ''}`}
                size="lg"
              >
                {isBypassMode ? (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel Bypass
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    ACTIVATE BYPASS
                  </>
                )}
              </Button>
            </div>

            {isBypassMode && (
              <div className="bg-green-100 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                  <ArrowRightLeft className="w-5 h-5" />
                  BYPASS MODE ACTIVE
                </div>

              </div>
            )}
          </CardHeader>
        </Card>

        {/* Quick Stats - Only show when NOT in bypass mode */}
        {!isBypassMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{stats.completedToday}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time</p>
                    <p className="text-2xl font-bold">{stats.averageTime}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Escalation Rate</p>
                    <p className="text-2xl font-bold">{stats.escalationRate}</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Counter</p>
                    <p className="text-2xl font-bold">{stats.counterApprovals}</p>
                  </div>
                  <Shield className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Overview - Only show when NOT in bypass mode */}
        {!isBypassMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5" />
                System Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={cn("flex-shrink-0 p-2 rounded-lg bg-muted", feature.color)}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bypass Configuration - Show when bypass mode is active */}
        {isBypassMode && (
          <Card className="shadow-elegant border-green-500">
            <CardContent className="p-6">
              <WorkflowConfiguration hideWorkflowsTab={true} />
            </CardContent>
          </Card>
        )}

      </div>
    </ResponsiveLayout>
  );
}
