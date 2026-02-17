import { useState, useEffect } from 'react';
import { emergencyNotificationService } from '@/services/EmergencyNotificationService';
import type { EmergencyNotificationSettings, EmergencyDocument } from '@/services/EmergencyNotificationService';

interface NotificationLog {
  id: string;
  recipientId: string;
  documentId: string;
  channel: string;
  title: string;
  message: string;
  urgencyLevel: string;
  timestamp: string;
  delivered: boolean;
}

interface EmergencySubmissionLog {
  id: string;
  document: EmergencyDocument;
  recipients: string[];
  settings: EmergencyNotificationSettings;
  timestamp: string;
  status: string;
}

export const useEmergencyNotifications = () => {
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [submissionLogs, setSubmissionLogs] = useState<EmergencySubmissionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load logs from localStorage
  useEffect(() => {
    const loadLogs = () => {
      try {
        const notifications = JSON.parse(localStorage.getItem('emergency-notification-logs') || '[]');
        const submissions = JSON.parse(localStorage.getItem('emergency-submissions') || '[]');
        
        setNotificationLogs(notifications);
        setSubmissionLogs(submissions);
      } catch (error) {
        console.error('Failed to load emergency notification logs:', error);
      }
    };

    loadLogs();

    // Set up interval to refresh logs
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Send emergency notification
  const sendEmergencyNotification = async (
    recipients: string[],
    document: EmergencyDocument,
    settings: EmergencyNotificationSettings
  ) => {
    setIsLoading(true);
    try {
      await emergencyNotificationService.sendEmergencyNotification(recipients, document, settings);
      
      // Refresh logs after sending
      const notifications = JSON.parse(localStorage.getItem('emergency-notification-logs') || '[]');
      const submissions = JSON.parse(localStorage.getItem('emergency-submissions') || '[]');
      
      setNotificationLogs(notifications);
      setSubmissionLogs(submissions);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send emergency notification:', error);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Stop notifications for a document
  const stopNotifications = (documentId: string) => {
    emergencyNotificationService.stopNotifications(documentId);
    
    // Update logs to reflect stopped status
    const updatedLogs = notificationLogs.map(log => 
      log.documentId === documentId 
        ? { ...log, delivered: false }
        : log
    );
    setNotificationLogs(updatedLogs);
  };

  // Get notification statistics
  const getNotificationStats = () => {
    const total = notificationLogs.length;
    const delivered = notificationLogs.filter(log => log.delivered).length;
    const byChannel = notificationLogs.reduce((acc, log) => {
      acc[log.channel] = (acc[log.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byUrgency = notificationLogs.reduce((acc, log) => {
      acc[log.urgencyLevel] = (acc[log.urgencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      delivered,
      deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
      byChannel,
      byUrgency
    };
  };

  // Get recent notifications
  const getRecentNotifications = (limit: number = 10) => {
    return notificationLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  // Get active emergencies
  const getActiveEmergencies = () => {
    return submissionLogs.filter(log => log.status === 'sent');
  };

  // Get scheduling options
  const getSchedulingOptions = () => {
    return emergencyNotificationService.getSchedulingOptions();
  };

  return {
    notificationLogs,
    submissionLogs,
    isLoading,
    sendEmergencyNotification,
    stopNotifications,
    getNotificationStats,
    getRecentNotifications,
    getActiveEmergencies,
    getSchedulingOptions
  };
};