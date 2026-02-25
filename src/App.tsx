import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DocumentWorkflowProvider } from "@/contexts/DocumentWorkflowContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { ErrorBoundary } from "@/utils/errorBoundary";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Documents from "@/pages/Documents";
import TrackDocuments from "@/pages/TrackDocuments";
import Calendar from "@/pages/Calendar";
import Messages from "@/pages/Messages";
import Approvals from "@/pages/Approvals";
import ApprovalRouting from "@/pages/ApprovalRouting";
import Analytics from "@/pages/Analytics";
import Emergency from "@/pages/Emergency";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes — prevent constant re-fetching
      gcTime: 10 * 60 * 1000,      // 10 minutes — keep cache longer
      retry: 1,                     // Only retry once instead of default 3
      refetchOnWindowFocus: false,  // Don't re-fetch when window regains focus
    },
  },
});

// Clean up localStorage on app start to prevent quota issues
function cleanupLocalStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    const totalSize = keys.reduce(
      (sum, key) => sum + (localStorage.getItem(key)?.length ?? 0) + key.length,
      0
    );

    const MAX_SIZE = 4 * 1024 * 1024;
    if (totalSize <= MAX_SIZE) return;

    console.log('Cleaning up localStorage...');

    try {
      const history = JSON.parse(localStorage.getItem('approval-history-new') || '[]');
      if (history.length > 30) {
        localStorage.setItem('approval-history-new', JSON.stringify(history.slice(0, 30)));
      }
    } catch (e) {
      console.error('Failed to clean approval history:', e);
    }

    const temporaryPrefixes = ['temp-', 'cache-', 'preview-'];
    keys
      .filter(key => temporaryPrefixes.some(prefix => key.startsWith(prefix)))
      .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('LocalStorage cleanup error:', error);
  }
}

cleanupLocalStorage();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <NotificationProvider>
              <DocumentWorkflowProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <TutorialProvider>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/documents" element={
                          <ProtectedRoute>
                            <Documents />
                          </ProtectedRoute>
                        } />
                        <Route path="/track-documents" element={
                          <ProtectedRoute>
                            <TrackDocuments />
                          </ProtectedRoute>
                        } />
                        <Route path="/calendar" element={
                          <ProtectedRoute>
                            <Calendar />
                          </ProtectedRoute>
                        } />
                        <Route path="/messages" element={
                          <ProtectedRoute>
                            <Messages />
                          </ProtectedRoute>
                        } />
                        <Route path="/approvals" element={
                          <ProtectedRoute requiredPermissions={['canApprove']}>
                            <Approvals />
                          </ProtectedRoute>
                        } />
                        <Route path="/approval-routing" element={
                          <ProtectedRoute requiredPermissions={['canManageWorkflows']}>
                            <ApprovalRouting />
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                          <ProtectedRoute requiredPermissions={['canViewAnalytics']}>
                            <Analytics />
                          </ProtectedRoute>
                        } />

                        <Route path="/emergency" element={
                          <ProtectedRoute>
                            <Emergency />
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <Profile />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </TutorialProvider>
                  </BrowserRouter>
                </TooltipProvider>
              </DocumentWorkflowProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
