import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getDashboardConfig } from '@/config/roleConfigs';
import { DashboardWidget } from '@/types/dashboard';
import { cn } from '@/lib/utils';

// Widget Components
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { DocumentsWidget } from './widgets/DocumentsWidget';
import { CalendarWidget } from './widgets/CalendarWidget';
import { NotificationsWidget } from './widgets/NotificationsWidget';
import { AnalyticsWidget } from './widgets/AnalyticsWidget';
interface DynamicDashboardProps {
  className?: string;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [dashboardConfig, setDashboardConfig] = useState<any>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);

  // Supported widget types - only these will be rendered
  const supportedWidgetTypes = [
    'quickActions', 'documents', 'calendar', 'notifications',
    'analytics'
  ];

  useEffect(() => {
    if (user) {
      const config = getDashboardConfig(user.role, user.department, user.branch);
      setDashboardConfig(config);

      // Clean up dashboard storage to prevent state issues
      localStorage.removeItem(`dashboard-widgets-${user.role}`);
      setWidgets(getDefaultWidgets(config));
    }
  }, [user]);

  const getDefaultWidgets = (config: any): DashboardWidget[] => {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'quickActions',
        type: 'quickActions',
        title: 'Quick Actions',
        position: { x: 0, y: 0, w: isMobile ? 12 : 6, h: 2 },
        visible: true,
        permissions: []
      },
      {
        id: 'documents',
        type: 'documents',
        title: 'Recent Documents',
        position: { x: isMobile ? 0 : 6, y: 0, w: isMobile ? 12 : 6, h: 3 },
        visible: true,
        permissions: []
      },
      {
        id: 'calendar',
        type: 'calendar',
        title: 'Calendar & Meetings',
        position: { x: 0, y: 2, w: isMobile ? 12 : 6, h: 3 },
        visible: true,
        permissions: []
      },
      {
        id: 'notifications',
        type: 'notifications',
        title: 'Notifications',
        position: { x: isMobile ? 0 : 6, y: 2, w: isMobile ? 12 : 6, h: 2 },
        visible: true,
        permissions: []
      },
      {
        id: 'analytics',
        type: 'analytics',
        title: 'Analytics',
        position: { x: 0, y: 5, w: isMobile ? 12 : 6, h: 2 },
        visible: config.permissions.canViewAnalytics &&
          !['employee', 'registrar', 'program-head', 'hod', 'principal'].includes(user?.role || ''),
        permissions: ['canViewAnalytics']
      },
    ];

    const filteredWidgets = defaultWidgets.filter(widget => {
      // Always include Quick Actions widget regardless of permissions
      if (widget.type === 'quickActions') return true;

      if (widget.permissions.length === 0) return widget.visible;
      return widget.permissions.every(permission =>
        config.permissions[permission as keyof typeof config.permissions]
      );
    });

    // Final safeguard: Ensure Quick Actions is always first
    const quickActionsIndex = filteredWidgets.findIndex(w => w.type === 'quickActions');
    if (quickActionsIndex > 0) {
      const quickActions = filteredWidgets.splice(quickActionsIndex, 1)[0];
      filteredWidgets.unshift(quickActions);
    }

    return filteredWidgets;
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!widget.visible) return null;

    const widgetProps = {
      userRole: user?.role || '',
      permissions: dashboardConfig?.permissions,
      isCustomizing: false,
      onSelect: () => { },
      isSelected: false
    };

    const WidgetComponent = () => {
      switch (widget.type) {
        case 'quickActions':
          return <QuickActionsWidget {...widgetProps} />;
        case 'documents':
          return <DocumentsWidget {...widgetProps} />;
        case 'calendar':
          return <CalendarWidget {...widgetProps} />;
        case 'notifications':
          return <NotificationsWidget {...widgetProps} />;
        case 'analytics':
          return <AnalyticsWidget {...widgetProps} />;
        default:
          return <div>Unknown widget type: {widget.type}</div>;
      }
    };

    return (
      <div
        key={widget.id}
        className="relative transition-all duration-200"
        style={{
          gridColumn: isMobile ? 'span 1' : `span ${widget.position.w}`,
          gridRow: `span ${widget.position.h}`
        }}
      >
        <WidgetComponent />
      </div>
    );
  };

  if (!user || !dashboardConfig) {
    return <div>Loading dashboard...</div>;
  }

  const layout = dashboardConfig.dashboardLayout;
  const currentLayout = isMobile ? layout.responsive.mobile :
    isTablet ? layout.responsive.tablet :
      layout.responsive.desktop;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 items-center text-center md:text-left md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className={cn(
            "font-bold",
            isMobile ? "text-2xl" : "text-3xl"
          )}>
            {dashboardConfig.displayName} Dashboard
          </h1>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        className={cn(
          "grid gap-4 auto-rows-min",
          isMobile ? "grid-cols-1" :
            isTablet ? "grid-cols-2" :
              "grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        )}
        style={{
          gridTemplateColumns: isMobile ? '1fr' :
            isTablet ? 'repeat(2, 1fr)' :
              `repeat(${currentLayout.columns}, 1fr)`
        }}
      >
        {widgets
          .filter(widget => widget.visible)
          .map(widget => renderWidget(widget))}
      </div>
    </div>
  );
};