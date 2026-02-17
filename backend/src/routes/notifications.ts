import { Router } from 'express';
import { 
  sendNotification, 
  getUserNotifications, 
  updateNotificationPreferences 
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/send', authenticateToken, sendNotification);
router.get('/', authenticateToken, getUserNotifications);
router.put('/preferences', authenticateToken, updateNotificationPreferences);

export default router;