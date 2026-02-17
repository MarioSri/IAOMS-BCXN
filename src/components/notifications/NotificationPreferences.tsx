import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiService } from '@/services/api';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  phone?: string;
  whatsapp_number?: string;
}

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    sms: false,
    whatsapp: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.updateNotificationPreferences(preferences);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email Notifications</Label>
          <Switch
            id="email"
            checked={preferences.email}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, email: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="push">Push Notifications</Label>
          <Switch
            id="push"
            checked={preferences.push}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, push: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sms">SMS Notifications</Label>
          <Switch
            id="sms"
            checked={preferences.sms}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, sms: checked }))
            }
          />
        </div>

        {preferences.sms && (
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={preferences.phone || ''}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+1234567890"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="whatsapp">WhatsApp Notifications</Label>
          <Switch
            id="whatsapp"
            checked={preferences.whatsapp}
            onCheckedChange={(checked) => 
              setPreferences(prev => ({ ...prev, whatsapp: checked }))
            }
          />
        </div>

        {preferences.whatsapp && (
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              type="tel"
              value={preferences.whatsapp_number || ''}
              onChange={(e) => 
                setPreferences(prev => ({ ...prev, whatsapp_number: e.target.value }))
              }
              placeholder="+1234567890"
            />
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
};