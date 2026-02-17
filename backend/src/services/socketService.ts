import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SocketUser } from '../types';

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, SocketUser> = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      socket.on('user:join', (userData: { id: string; email: string }) => {
        const user: SocketUser = {
          ...userData,
          socketId: socket.id
        };
        this.connectedUsers.set(socket.id, user);
        socket.join(`user:${userData.id}`);
      });

      socket.on('document:subscribe', (documentId: string) => {
        socket.join(`document:${documentId}`);
      });

      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.id);
        console.log('User disconnected:', socket.id);
      });
    });
  }

  public emitToDocument(documentId: string, event: string, data: any) {
    this.io.to(`document:${documentId}`).emit(event, data);
  }

  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }
}