import { EmailService } from './emailService';
import { SocketService } from './socketService';
import { NotificationPreferences } from '../types';

const notifications: any[] = [];

export class NotificationService {
  constructor(
    private socketService: SocketService,
    private emailService: EmailService
  ) { }

  async sendNotificationToRecipients(
    recipientIds: string[],
    notification: {
      title: string;
      message: string;
      type: 'document' | 'approval' | 'reminder' | 'general';
      data?: any;
    }
  ) {
    for (const recipientId of recipientIds) {
      const user = {
        id: recipientId,
        email: 'user@example.com', // Placeholder
        notification_preferences: {
          email: true,
          push: true,
          sms: false,
          whatsapp: false
        }
      };

      if (user) {
        await this.deliverNotification(user, notification);
      }
    }
  }

  private async deliverNotification(
    user: any,
    notification: {
      title: string;
      message: string;
      type: string;
      data?: any;
    }
  ) {
    const prefs = user.notification_preferences || {
      email: true,
      push: true,
      sms: false,
      whatsapp: false
    };

    if (prefs.push) {
      this.socketService.emitToUser(user.id, 'notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    }

    if (prefs.email) {
      await EmailService.sendNotification(
        user.email,
        notification.title,
        `<p>${notification.message}</p>`
      );
    }

    if (prefs.sms && user.phone) {
      await this.sendSMS(user.phone, notification.message);
    }

    if (prefs.whatsapp && user.whatsapp_number) {
      await this.sendWhatsApp(user.whatsapp_number, notification.message);
    }

    notifications.push({
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      delivered_via: this.getDeliveryMethods(prefs),
      created_at: new Date().toISOString()
    });
  }

  private async sendSMS(phone: string, message: string) {
    console.log(`SMS to ${phone}: ${message}`);
  }

  private async sendWhatsApp(number: string, message: string) {
    console.log(`WhatsApp to ${number}: ${message}`);
  }

  private getDeliveryMethods(prefs: NotificationPreferences): string[] {
    const methods = [];
    if (prefs.push) methods.push('push');
    if (prefs.email) methods.push('email');
    if (prefs.sms) methods.push('sms');
    if (prefs.whatsapp) methods.push('whatsapp');
    return methods;
  }
}