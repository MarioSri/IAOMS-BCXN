import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import { SocketService } from './services/socketService';
import { RealtimeIntegration } from './services/realtimeIntegration';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import fileRoutes from './routes/files';
import searchRoutes from './routes/search';
import notificationRoutes from './routes/notifications';
import auditLogRoutes from './routes/auditLog';
import faceAuthRoutes from './routes/faceAuth';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

const socketService = new SocketService(server);

new RealtimeIntegration(socketService);

app.use(helmet());
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/face-auth', faceAuthRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});