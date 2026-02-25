import React, { useState, useEffect } from 'react';
import { DynamicDashboard } from './DynamicDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';
import { getDashboardConfig } from '@/config/roleConfigs';
import { cn } from '@/lib/utils';
import { userProfileService } from '@/services/UserProfileService';
import { isAllowedMockData, logDataSource, DataSource } from '@/utils/roleUtils';
import { DemoIndicator, LiveDataIndicator } from '@/components/ui/DemoIndicator';
import {
  Crown,
  Shield,
  Users,
  Building,
  User
} from 'lucide-react';

interface ProfileData {
  name?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
}

export const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  // 'loading' prevents "Profile Not Yet Configured" from flashing while the
  // Supabase request is in-flight. It transitions to 'real'/'mock'/'empty'
  // only once the fetch has resolved.
  const [dataSource, setDataSource] = useState<DataSource>('loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const isDemoWork = isAllowedMockData(user.role);

        if (isDemoWork) {
          // Demo Work ONLY: Load from MOCK_RECIPIENTS
          const { MOCK_RECIPIENTS } = await import('@/contexts/AuthContext');
          const recipient = MOCK_RECIPIENTS.find(r => r.user_id === user.id);

          if (recipient) {
            setProfileData({
              name: recipient.name,
              department: recipient.department,
              designation: recipient.role,
              employeeId: recipient.user_id
            });
            setDataSource('mock');
            logDataSource('RoleDashboard', 'mock', recipient.name);
          }
        } else {
          // Real Roles (Principal, Registrar, HOD, Program Head, Employee):
          // Fetch EXCLUSIVELY from Supabase role_recipients table.
          // NO mock names are permitted here.
          const emailKey = user.email;
          const profile = emailKey
            ? await userProfileService.fetchProfileByEmail(emailKey)
            : await userProfileService.fetchProfile(user.id);

          if (profile) {
            setProfileData({
              name: profile.name,
              department: profile.department,
              designation: profile.designation || profile.role,
              employeeId: profile.employee_id || profile.id
            });
            setDataSource('real');
            logDataSource('RoleDashboard', 'real', profile.name);
          } else {
            // No profile found in Supabase — show empty state.
            // Do NOT fall back to mock names.
            setProfileData({
              name: '',
              department: '',
              designation: '',
              employeeId: ''
            });
            setDataSource('empty');
            logDataSource('RoleDashboard', 'empty', 'Profile not yet configured in Supabase');
          }
        }
      } catch (error) {
        console.error('❌ [RoleDashboard] Error loading profile:', error);
        setError('Failed to load profile data');
        // On error keep whatever profile we already have (if any).
        // Only fall to empty if we have nothing — avoids wiping a previously
        // loaded name on a transient network glitch.
        setProfileData(prev => prev ?? { name: '', department: '', designation: '', employeeId: '' });
        setDataSource('empty');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (!user) return null;

  const dashboardConfig = getDashboardConfig(user.role, user.department, user.branch);

  const getRoleIcon = () => {
    switch (user.role) {
      case 'principal':
      case 'demo-work': return Crown;
      case 'registrar': return Shield;
      case 'program-head': return Users;
      case 'hod': return Building;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon();

  const getRoleDescription = () => {
    switch (user.role) {
      case 'principal':
      case 'demo-work':
        return 'Complete institutional oversight with full administrative control, mass distribution capabilities, and system-wide analytics.';
      case 'registrar':
        return 'Academic administration with document approval authority, workflow management, and cross-departmental coordination.';
      case 'program-head':
        return `Program-specific management for ${user.branch || 'department'} with focused approval workflows and academic scheduling.`;
      case 'hod':
        return `Department leadership for ${user.department} with faculty management, document approvals, and departmental analytics.`;
      default:
        return 'Document submission and tracking with personal task management and communication tools.';
    }
  };

  const getEnabledFeatures = () => {
    return Object.entries(dashboardConfig.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
  };

  const enabledFeatures = getEnabledFeatures();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Data Source Alert for Demo Mode */}
      {dataSource === 'mock' && (
        <DemoIndicator variant="alert" location="dashboard" />
      )}

      {/* Role Welcome Banner */}
      <Card className="shadow-elegant bg-gradient-primary text-primary-foreground border-0">
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <div className={cn(
            "flex gap-4",
            isMobile ? "flex-col items-center text-center" : "items-center"
          )}>
            <div className={cn(
              "rounded-full bg-white/20 flex items-center justify-center shadow-lg shrink-0",
              isMobile ? "w-16 h-16" : "w-16 h-16" // Keep large icon on mobile for visual impact
            )}>
              <RoleIcon className={cn(
                "text-white",
                isMobile ? "w-8 h-8" : "w-8 h-8"
              )} />
            </div>

            <div className="flex-1">
              <h1 className={cn(
                "font-bold leading-tight",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                Welcome to IAOMS Dashboard
              </h1>
              <p className={cn(
                "opacity-90 mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                {profileData?.name
                  ? <>Logged in as <span className="font-semibold">{profileData.name}</span></>
                  : dataSource === 'empty'
                    ? <span className="opacity-70 italic">Profile Not Yet Configured — Please Contact Your Admin.</span>
                    : <span className="opacity-70">Loading profile...</span>
                }
              </p>
              <div className={cn(
                "flex flex-wrap gap-2 mt-3",
                isMobile ? "justify-center" : "justify-start"
              )}>
                <Badge className="bg-white/20 text-white border-white/30 font-medium">
                  Role: {dashboardConfig.displayName}
                </Badge>
                {profileData?.department && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {profileData.department}
                  </Badge>
                )}
                {dataSource === 'mock' && (
                  <Badge className="bg-amber-500/90 text-white border-white/30 font-medium">
                    Demo Mode
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Role Description */}
          {/* Role Description - Hidden on Mobile */}
          {!isMobile && (
            <div className="mt-4 p-4 bg-white/10 rounded-lg">
              <p className="opacity-90 text-base">
                {getRoleDescription()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Dynamic Dashboard */}
      <DynamicDashboard />
    </div>
  );
};
