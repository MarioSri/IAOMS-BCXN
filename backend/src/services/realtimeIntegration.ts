import { SocketService } from './socketService';

export class RealtimeIntegration {
    private socketService: SocketService;

    constructor(socketService: SocketService) {
        this.socketService = socketService;
        this.initialize();
    }

    private initialize() {
        console.log('Realtime integration initialized');
    }
}
