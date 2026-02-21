import { useEffect, useState } from "react";
import { AuthenticationCard } from "@/components/auth/AuthenticationCard";
import { HITAMTreeLoading } from "@/components/ui/loading-animation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  principal: 'Principal',
  'demo-work': 'Demo Work Role',
  registrar: 'Registrar',
  hod: 'Head of Department',
  'program-head': 'Program Department Head',
  employee: 'Employee',
};

export default function Index() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState(0);


  useEffect(() => {
    if (isLoading) {
      setLoadingKey(Date.now());
    }
  }, [isLoading]);

  async function handleLogin(role: string) {
    try {
      await login(role);

      toast.success('Welcome to IAOMS!', {
        description: `Successfully logged in as ${ROLE_DISPLAY_NAMES[role] ?? role}`,
        duration: 3000,
      });
    } catch (error) {
      toast.error('Login Failed', {
        description: 'Unable to authenticate. Please try again.',
      });
    }
  }


  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = localStorage.getItem('iaoms-redirect-path');
      if (redirectPath) {
        localStorage.removeItem('iaoms-redirect-path');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <HITAMTreeLoading key={loadingKey} size="lg" />
      </div>
    );
  }

  // Show authentication card only for unauthenticated users
  return <AuthenticationCard onLogin={handleLogin} />;
}