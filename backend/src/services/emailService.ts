import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendNotification(to: string, subject: string, html: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to,
        subject,
        html,
      });

      if (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error };
    }
  }

  static async sendDocumentApprovalRequest(to: string, documentTitle: string, approverName: string) {
    const html = `
      <h2>Document Approval Request</h2>
      <p>Hello ${approverName},</p>
      <p>You have a new document approval request for: <strong>${documentTitle}</strong></p>
      <p>Please log in to your dashboard to review and approve the document.</p>
    `;

    return this.sendNotification(to, `Document Approval Required: ${documentTitle}`, html);
  }
}