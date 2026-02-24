import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoIndicatorProps {
  variant: 'badge' | 'alert' | 'inline';
  location?: 'profile' | 'dashboard' | 'recipients';
  className?: string;
}

export const DemoIndicator: React.FC<DemoIndicatorProps> = ({
  variant,
  location = 'profile',
  className
}) => {
  // Hide specific demo indicators as requested
  if (variant === 'alert' && (location === 'profile' || location === 'dashboard')) {
    return null;
  }

  const messages = {
    profile: 'Viewing demonstration profile data',
    dashboard: 'Showing demonstration dashboard',
    recipients: 'Showing Mock Recipients for Demonstration Purposes.'
  };

  if (variant === 'badge') {
    return (
      <Badge
        variant="outline"
        className={cn(
          "bg-amber-100 text-amber-800 border-amber-300 font-medium",
          className
        )}
      >
        <AlertCircle className="w-3 h-3 mr-1" />
        Demo Mode
      </Badge>
    );
  }

  if (variant === 'inline') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200",
        className
      )}>
        <AlertCircle className="w-3 h-3" />
        Demo Mode
      </span>
    );
  }

  return (
    <Alert className={cn("bg-amber-50 border-amber-200", className)}>
      <AlertCircle className="h-4 w-4 text-amber-800" />
      <AlertDescription className="text-amber-800">
        <strong>Demo Mode:</strong> {messages[location]}
      </AlertDescription>
    </Alert>
  );
};

export const LiveDataIndicator: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        "bg-green-100 text-green-800 border-green-300 font-medium",
        className
      )}
    >
      <Database className="w-3 h-3 mr-1" />
      Live Data
    </Badge>
  );
};
