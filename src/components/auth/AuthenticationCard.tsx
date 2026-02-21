import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Shield, Users, FileText, ArrowLeft } from "lucide-react";
import { HITAMTreeLoading } from "@/components/ui/loading-animation";
import { PersonalInformationForm, PersonalInfoData } from "@/components/shared/PersonalInformationForm";
import { useToast } from "@/hooks/use-toast";

interface AuthenticationCardProps {
  onLogin: (role: string) => void;
}

export function AuthenticationCard({ onLogin }: AuthenticationCardProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"google" | "hitam">("google");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [signupMethod, setSignupMethod] = useState<"google" | "hitam" | null>(null);
  const { toast } = useToast();

  const carouselImages = [
    '/carousel-1.jpg',
    '/carousel-3.png',
    '/carousel-4.webp'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const roles = [
    { value: "principal", label: "Principal", icon: Building2 },
    { value: "demo-work", label: "Demo Work Role", icon: Building2 },
    { value: "registrar", label: "Registrar", icon: Shield },
    { value: "hod", label: "HOD", icon: Users },
    { value: "program-head", label: "Program Department Head", icon: Users },
    { value: "employee", label: "Employee", icon: FileText },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      setIsLoading(true);
      onLogin(selectedRole);
    }
  };

  const handleSignup = (method: "google" | "hitam") => {
    if (!selectedRole) return;

    setSignupMethod(method);
    setShowPersonalInfo(true);
    toast({
      title: "Signup Successful",
      description: `Please complete your personal information to continue.`,
      variant: "default"
    });
  };

  const handlePersonalInfoSave = (data: PersonalInfoData) => {
    // Save to localStorage for profile and dashboard display
    localStorage.setItem('user-profile', JSON.stringify(data));

    setIsLoading(true);
    setTimeout(() => {
      onLogin(selectedRole);
    }, 1000);
  };

  const handleBackToLogin = () => {
    setShowPersonalInfo(false);
    setSignupMethod(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <HITAMTreeLoading size="lg" />
      </div>
    );
  }

  if (showPersonalInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-2">
        <Card className="w-full max-w-6xl shadow-elegant">
          <CardHeader className="text-center space-y-1 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToLogin}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
                <CardDescription>
                  Please fill in your personal information to continue
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <PersonalInformationForm
              onSave={handlePersonalInfoSave}
              isStandalone={true}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-4xl shadow-elegant overflow-hidden">
        <div className="flex">
          {/* Image Carousel */}
          <div className="hidden lg:block flex-1 relative bg-gray-100">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <img
                  src={image}
                  alt={`Carousel ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}

            {/* Dot Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                    ? 'bg-white scale-110'
                    : 'bg-white/50 hover:bg-white/75'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                <Building2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">IAOMS Login</CardTitle>
                <CardDescription>
                  Hyderabad Institute of Technology and Management
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Select Your Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <role.icon className="w-4 h-4" />
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={loginMethod === "google" ? "default" : "outline"}
                    onClick={() => setLoginMethod("google")}
                    className="flex-1"
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant={loginMethod === "hitam" ? "default" : "outline"}
                    onClick={() => setLoginMethod("hitam")}
                    className="flex-1"
                  >
                    HITAM ID
                  </Button>
                </div>

                {loginMethod === "google" ? (
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={!selectedRole}
                    >
                      Log in with Google (@hitam.org)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Only @hitam.org email addresses are allowed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hitam-id">HITAM ID</Label>
                      <Input id="hitam-id" placeholder="Enter your HITAM ID" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" />
                    </div>
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={!selectedRole}
                    >
                      Log in
                    </Button>
                  </div>
                )}
              </form>

              <Separator />

              <div className="text-center text-sm text-muted-foreground">
                <p>Institutional Activity Oversight and Management System</p>
                <p className="text-xs mt-1">© 2025 HITAM. All rights reserved.</p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}