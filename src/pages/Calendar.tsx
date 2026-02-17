import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { MeetingScheduler } from "@/components/meetings/MeetingScheduler";
import { useAuth } from "@/contexts/AuthContext";

export default function Calendar() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ResponsiveLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">📅 Meeting Scheduler</h1>
          <p className="text-muted-foreground">The smart way to schedule meetings and manage your calendar, with advanced integration for Google Meet, Zoom, and Microsoft Teams.</p>
        </div>

        <MeetingScheduler userRole={user.role} />
      </div>
    </ResponsiveLayout>
  );
}