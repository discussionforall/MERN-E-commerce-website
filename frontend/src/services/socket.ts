import { io, Socket } from 'socket.io-client';

/**
 * @deprecated This SocketService is deprecated. Use the useSocket() hook from SocketContext instead.
 * This service creates a separate socket connection which can cause issues with real-time updates.
 * All components should use the SocketContext for consistent socket management.
 */
class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://backend:5000', {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('connect_error', error => {
      console.error('❌ Socket.io connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Product event listeners
  onProductCreated(callback: (product: any) => void): void {
    if (this.socket) {
      this.socket.on('product:created', product => {
        callback(product);
      });
    }
  }

  onProductUpdated(callback: (product: any) => void): void {
    if (this.socket) {
      this.socket.on('product:updated', product => {
        callback(product);
      });
    }
  }

  onProductDeleted(callback: (productId: string) => void): void {
    if (this.socket) {
      this.socket.on('product:deleted', productId => {
        callback(productId);
      });
    }
  }

  onProductsBulkImported(callback: (data: {
    success: number;
    failed: number;
    total: number;
    message: string;
  }) => void): void {
    if (this.socket) {
      this.socket.on('products:bulk_imported', data => {
        callback(data);
      });
    }
  }

  // Review event listeners
  onReviewCreated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('review:created', data => {
        callback(data);
      });
    }
  }

  onReviewUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('review:updated', data => {
        callback(data);
      });
    }
  }

  onReviewDeleted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('review:deleted', data => {
        callback(data);
      });
    }
  }

  // Remove listeners
  offProductCreated(callback: (product: any) => void): void {
    if (this.socket) {
      this.socket.off('product:created', callback);
    }
  }

  offProductUpdated(callback: (product: any) => void): void {
    if (this.socket) {
      this.socket.off('product:updated', callback);
    }
  }

  offProductDeleted(callback: (productId: string) => void): void {
    if (this.socket) {
      this.socket.off('product:deleted', callback);
    }
  }

  offProductsBulkImported(callback: (data: {
    success: number;
    failed: number;
    total: number;
    message: string;
  }) => void): void {
    if (this.socket) {
      this.socket.off('products:bulk_imported', callback);
    }
  }

  // Remove review listeners
  offReviewCreated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('review:created', callback);
    }
  }

  offReviewUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('review:updated', callback);
    }
  }

  offReviewDeleted(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('review:deleted', callback);
    }
  }
}

export const socketService = new SocketService();
