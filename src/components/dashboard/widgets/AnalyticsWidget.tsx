import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Activity,
  Eye
} from 'lucide-react';

interface AnalyticsData {
  documentStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    avgProcessingTime: number;
  };
  departmentStats: Array<{
    name: string;
    documents: number;
    approvalRate: number;
    avgTime: number;
  }>;
  trends: Array<{
    period: string;
    documents: number;
    approvals: number;
    rejections: number;
  }>;
  userActivity: {
    activeUsers: number;
    documentsToday: number;
    approvalsToday: number;
    peakHours: string;
  };
}

interface AnalyticsWidgetProps {
  userRole: string;
  permissions: any;
  isCustomizing?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  userRole,
  permissions,
  isCustomizing,
  onSelect,
  isSelected
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch analytics data
    const fetchAnalytics = async () => {
      setLoading(true);

      const mockAnalytics: AnalyticsData = {
        documentStats: {
          total: (userRole === 'principal' || userRole === 'demo-work') ? 247 : userRole === 'registrar' ? 189 : userRole === 'hod' ? 67 : 23,
          approved: (userRole === 'principal' || userRole === 'demo-work') ? 198 : userRole === 'registrar' ? 156 : userRole === 'hod' ? 52 : 18,
          rejected: (userRole === 'principal' || userRole === 'demo-work') ? 31 : userRole === 'registrar' ? 21 : userRole === 'hod' ? 7 : 2,
          pending: (userRole === 'principal' || userRole === 'demo-work') ? 18 : userRole === 'registrar' ? 12 : userRole === 'hod' ? 8 : 3,
          avgProcessingTime: (userRole === 'principal' || userRole === 'demo-work') ? 2.3 : userRole === 'registrar' ? 1.8 : userRole === 'hod' ? 1.5 : 0.8
        },
        departmentStats: [
          { name: 'CSE', documents: 45, approvalRate: 89, avgTime: 2.1 },
          { name: 'EEE', documents: 38, approvalRate: 92, avgTime: 1.9 },
          { name: 'ECE', documents: 42, approvalRate: 87, avgTime: 2.3 },
          { name: 'MECH', documents: 35, approvalRate: 94, avgTime: 1.7 },
          { name: 'CSM', documents: 28, approvalRate: 91, avgTime: 2.0 },
          { name: 'CSO', documents: 25, approvalRate: 88, avgTime: 2.2 }
        ],
        trends: [
          { period: 'Week 1', documents: 45, approvals: 38, rejections: 7 },
          { period: 'Week 2', documents: 52, approvals: 44, rejections: 8 },
          { period: 'Week 3', documents: 48, approvals: 41, rejections: 7 },
          { period: 'Week 4', documents: 56, approvals: 49, rejections: 7 }
        ],
        userActivity: {
          activeUsers: (userRole === 'principal' || userRole === 'demo-work') ? 156 : userRole === 'registrar' ? 89 : userRole === 'hod' ? 23 : 12,
          documentsToday: (userRole === 'principal' || userRole === 'demo-work') ? 23 : userRole === 'registrar' ? 15 : userRole === 'hod' ? 8 : 3,
          approvalsToday: (userRole === 'principal' || userRole === 'demo-work') ? 18 : userRole === 'registrar' ? 12 : userRole === 'hod' ? 6 : 0,
          peakHours: '10:00 AM - 12:00 PM'
        }
      };

      setTimeout(() => {
        setAnalytics(mockAnalytics);
        setLoading(false);
      }, 800);
    };

    fetchAnalytics();
  }, [userRole, timeframe]);

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, direction: 'stable' as const };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const
    };
  };

  if (loading) {
    return (
      <Card className={cn(
        "shadow-elegant",
        isSelected && "border-primary",
        isCustomizing && "cursor-pointer"
      )} onClick={onSelect}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const approvalRate = (analytics.documentStats.approved / analytics.documentStats.total) * 100;
  const rejectionRate = (analytics.documentStats.rejected / analytics.documentStats.total) * 100;

  return (
    <Card className={cn(
      "shadow-elegant hover:shadow-glow transition-all duration-300",
      isSelected && "border-primary",
      isCustomizing && "cursor-pointer"
    )} onClick={onSelect}>
      <CardHeader className={cn(isMobile && "pb-3")}>
        <div className={cn(
          "flex justify-between",
          isMobile ? "flex-col gap-3" : "items-center"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-lg" : "text-xl"
          )}>
            <BarChart3 className="w-5 h-5 text-primary" />
            Analytics
          </CardTitle>

          <div className={cn(
            "flex items-center gap-2",
            isMobile && "w-full justify-between"
          )}>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-2 py-1 border rounded text-xs"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/analytics")}
              className={cn(isMobile && "text-xs")}
            >
              <Eye className="w-4 h-4 mr-1" />
              Details
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-success/10 rounded-lg border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className={cn(
                "font-medium text-success",
                isMobile ? "text-sm" : "text-base"
              )}>
                Approval Rate
              </span>
            </div>
            <p className={cn(
              "font-bold text-success",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {approvalRate.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-success" />
              <span className="text-xs text-success">+2.3% vs last {timeframe}</span>
            </div>
          </div>

          <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-warning" />
              <span className={cn(
                "font-medium text-warning",
                isMobile ? "text-sm" : "text-base"
              )}>
                Avg. Time
              </span>
            </div>
            <p className={cn(
              "font-bold text-warning",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {analytics.documentStats.avgProcessingTime}d
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="w-3 h-3 text-success" />
              <span className="text-xs text-success">-0.5d improvement</span>
            </div>
          </div>
        </div>

        {/* Department Performance (for Principal/Registrar) */}
        {(userRole === 'principal' || userRole === 'demo-work' || userRole === 'registrar') && (
          <div>
            <h4 className={cn(
              "font-semibold mb-2",
              isMobile ? "text-sm" : "text-base"
            )}>
              Top Performing Departments
            </h4>
            <div className="space-y-2">
              {analytics.departmentStats
                .sort((a, b) => b.approvalRate - a.approvalRate)
                .slice(0, 3)
                .map((dept, index) => (
                  <div
                    key={dept.name}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        isMobile ? "text-sm" : "text-base"
                      )}>
                        {dept.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold text-success",
                        isMobile ? "text-sm" : "text-base"
                      )}>
                        {dept.approvalRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dept.documents} docs
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Trends */}
        <div>
          <h4 className={cn(
            "font-semibold mb-2",
            isMobile ? "text-sm" : "text-base"
          )}>
            Recent Trends
          </h4>
          <div className="space-y-2">
            {analytics.trends.slice(-3).map((trend, index) => {
              const approvalRate = (trend.approvals / trend.documents) * 100;
              return (
                <div
                  key={trend.period}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded"
                >
                  <span className={cn(
                    "font-medium",
                    isMobile ? "text-sm" : "text-base"
                  )}>
                    {trend.period}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {trend.documents} docs
                    </span>
                    <Badge
                      variant={approvalRate >= 90 ? "success" : approvalRate >= 80 ? "default" : "warning"}
                      className="text-xs"
                    >
                      {approvalRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Activity (for Principal/Registrar) */}
        {(userRole === 'principal' || userRole === 'demo-work' || userRole === 'registrar') && (
          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-2 bg-primary/10 rounded">
                <p className={cn(
                  "font-bold text-primary",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  {analytics.userActivity.activeUsers}
                </p>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Active Users
                </p>
              </div>
              <div className="p-2 bg-success/10 rounded">
                <p className={cn(
                  "font-bold text-success",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  {analytics.userActivity.documentsToday}
                </p>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Today's Docs
                </p>
              </div>
            </div>

            <div className="mt-2 p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">
                Peak Activity: {analytics.userActivity.peakHours}
              </p>
            </div>
          </div>
        )}

        {/* Widget Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>Live data</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/analytics")}
          >
            Full Report
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};