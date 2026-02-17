import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { SelfReminderSystem } from "@/components/shared/SelfReminderSystem";
import { useAuth } from "@/contexts/AuthContext";

export default function Reminders() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Personal Reminders</h1>
          <p className="text-muted-foreground">Stay organized with smart reminder notifications</p>
        </div>

        <SelfReminderSystem userRole={user.role} />
      </div>
    </ResponsiveLayout>
  );
}