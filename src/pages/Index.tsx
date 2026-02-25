import { useEffect, useState } from "react";
import { AuthenticationCard } from "@/components/auth/AuthenticationCard";
import { HITAMTreeLoading } from "@/components/ui/loading-animation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Index() {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setLoadingKey(Date.now());
    }
  }, [isLoading]);

  /**
   * handleLogin — only called for 'demo-work' via the Demo Mode button.
   * Real auth (Google / Employee ID) goes through AuthService → AuthContext.loginWithResult.
   */
  async function handleLogin(role: string) {
    try {
      await login(role);

      toast.success('Welcome to IAOMS!', {
        description: 'Demo mode active — showing demonstration data.',
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

  return <AuthenticationCard onLogin={handleLogin} />;
}