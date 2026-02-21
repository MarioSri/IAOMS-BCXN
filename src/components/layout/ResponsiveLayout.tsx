import React, { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { MobileHeader } from './MobileHeader';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden p-0 m-0">
        <MobileHeader />
        <main className="pb-6 px-4 pt-16 min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <DashboardLayout userRole={user.role} onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  );
};