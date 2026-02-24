import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Bell,
  Camera,
  Edit,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";
import { PersonalInformationForm, PersonalInfoData } from "@/components/shared/PersonalInformationForm";
import { userProfileService } from "@/services/UserProfileService";
import { isAllowedMockData, logDataSource, DataSource } from "@/utils/roleUtils";
import { DemoIndicator, LiveDataIndicator } from "@/components/ui/DemoIndicator";

export default function Profile() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('empty');

  const [profileData, setProfileData] = useState<PersonalInfoData>({
    name: "",
    email: "",
    phone: "",
    department: "",
    employeeId: "",
    designation: "",
    bio: "",
    avatar: ""
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: { enabled: true, interval: 15, unit: 'minutes' },
    sms: { enabled: false, interval: 30, unit: 'minutes' },
    push: { enabled: true, interval: 5, unit: 'minutes' },
    whatsapp: { enabled: false, interval: 1, unit: 'hours' }
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        const isDemoWork = isAllowedMockData(user.role);

        if (isDemoWork) {
          // Demo Work ONLY: Load from MOCK_RECIPIENTS
          const { MOCK_RECIPIENTS } = await import('@/contexts/AuthContext');
          const mockProfile = MOCK_RECIPIENTS.find(r => r.user_id === user.id);

          if (mockProfile) {
            setProfileData({
              name: mockProfile.name,
              email: mockProfile.email,
              phone: "",
              department: mockProfile.department,
              employeeId: mockProfile.user_id,
              designation: mockProfile.role,
              bio: "",
              avatar: mockProfile.avatar
            });
            setDataSource('mock');
            logDataSource('Profile', 'mock', mockProfile.name);
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
              email: profile.email,
              phone: profile.phone || "",
              department: profile.department || "",
              employeeId: profile.employee_id || profile.id,
              designation: profile.designation || profile.role,
              bio: profile.bio || "",
              avatar: profile.avatar || ""
            });
            setDataSource('real');
            logDataSource('Profile', 'real', profile.name);
          } else {
            // No profile found in Supabase — show empty state.
            // Do NOT fall back to mock names.
            setProfileData({
              name: "",
              email: "",
              phone: "",
              department: "",
              employeeId: "",
              designation: "",
              bio: "",
              avatar: ""
            });
            setDataSource('empty');
            logDataSource('Profile', 'empty', 'Profile not yet configured in Supabase');
          }
        }

        // Load notification preferences (UI preferences only)
        const savedNotificationPrefs = localStorage.getItem(`user-preferences-${user.id}`);
        if (savedNotificationPrefs) {
          setNotificationPreferences(JSON.parse(savedNotificationPrefs));
        }
      } catch (error) {
        console.error('❌ [Profile] Error loading profile data:', error);
        setError('Failed to load profile data. Please try again.');
        setDataSource('empty');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const handleSaveProfile = async (data: PersonalInfoData) => {
    try {
      if (isAllowedMockData(user?.role || '')) {
        // Demo Work: save locally only
        localStorage.setItem('user-profile', JSON.stringify(data));
      }
      // Real roles: profile editing is view-only for now;
      // edits are applied in-memory. Backend update via Supabase can be
      // wired here when admin-level write access is granted.

      setProfileData(data);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error Saving Profile",
        description: "Failed to save profile.",
        variant: "destructive"
      });
    }
  };

  const handleNotificationPreferenceChange = (channel: string, field: string, value: any) => {
    const updated = {
      ...notificationPreferences,
      [channel]: {
        ...(notificationPreferences as any)[channel],
        [field]: value
      }
    };
    setNotificationPreferences(updated as any);
    localStorage.setItem(`user-preferences-${user?.id || 'default'}`, JSON.stringify(updated));

    toast({
      title: "Notification Preference Updated",
      description: `${channel} ${field} has been updated.`,
    });
  };

  const handleSignOut = () => {
    toast({
      title: "Signing Out",
      description: "Redirecting to login page...",
    });
    setTimeout(() => {
      navigate("/");
    }, 1000);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileData(prev => ({ ...prev, avatar: result }));
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <ResponsiveLayout>
        <div className="container mx-auto p-4 md:p-6 max-w-4xl">
          <div className="mb-6 h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
            <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile Settings</h1>
            {dataSource === 'mock' && <DemoIndicator variant="badge" />}
            {dataSource === 'real' && <LiveDataIndicator />}
          </div>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        {/* Data Source Alert */}
        {dataSource === 'mock' && (
          <DemoIndicator variant="alert" location="profile" className="mb-6" />
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive font-medium">Profile Data Temporarily Unavailable</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={cn("grid w-full grid-cols-2", isMobile ? "h-auto p-1" : "h-12")}>
            <TabsTrigger value="profile" className="h-9 md:h-10">Profile</TabsTrigger>
            <TabsTrigger value="preferences" className="h-9 md:h-10">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 md:w-32 md:h-32">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback>
                        {profileData.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-xl md:text-2xl font-bold">{profileData.name || 'Not Set'}</h2>
                    <p className="text-muted-foreground">{profileData.designation || 'No designation'}</p>
                    <Badge variant="outline" className="mt-2">
                      ID: {profileData.employeeId || 'N/A'}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "default" : "outline"}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {isEditing ? (
              <PersonalInformationForm
                onSave={handleSaveProfile}
                initialData={profileData}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{profileData.name || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{profileData.email || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{profileData.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{profileData.department || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 mt-2">
                <div className="flex items-center justify-between p-1 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email.enabled}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('email', 'enabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-1 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-0.5">
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Browser and mobile notifications</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.push.enabled}
                    onCheckedChange={(checked) => handleNotificationPreferenceChange('push', 'enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-destructive">Sign Out</h4>
                    <p className="text-sm text-muted-foreground">Terminate your current session</p>
                  </div>
                  <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}