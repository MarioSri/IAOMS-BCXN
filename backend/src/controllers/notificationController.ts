import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { SocketService } from '../services/socketService';
import { EmailService } from '../services/emailService';

const socketService = new SocketService(null as any); // Will be injected
const emailService = new EmailService();
const notificationService = new NotificationService(socketService, emailService);

const userPreferences = new Map<string, any>();
const notificationsStore: any[] = [];

export async function sendNotification(req: Request, res: Response) {
  try {
    const { recipientIds, title, message, type, data } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients are required'
      });
    }

    await notificationService.sendNotificationToRecipients(recipientIds, {
      title,
      message,
      type: type || 'general',
      data
    });

    return res.json({ success: true, message: 'Notifications sent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to send notifications' });
  }
}

export async function getUserNotifications(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const data = notificationsStore
      .filter(n => n.user_id === user?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
}

export async function updateNotificationPreferences(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const preferences = req.body;

    if (user?.id) {
      userPreferences.set(user.id, preferences);
    }

    return res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update preferences' });
  }
}