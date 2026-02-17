import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { EmergencyWorkflowInterface } from "@/components/emergency/EmergencyWorkflowInterface";
import { useAuth } from "@/contexts/AuthContext";

export default function Emergency() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Emergency Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Priority Document Submission and Emergency Response</p>
        </div>

        <EmergencyWorkflowInterface userRole={user.role} />
      </div>
    </ResponsiveLayout>
  );
}