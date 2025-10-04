import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'coupon' | 'order' | 'product' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useSocket();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleCouponCreated = (data: { coupon: any; message: string }) => {
      const notification: Notification = {
        id: `coupon-${data.coupon._id}-${Date.now()}`,
        type: 'coupon',
        title: 'New Coupon Available!',
        message: data.message,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only last 50
      
      // Show toast notification
      toast.success(data.message, {
        duration: 5000,
        icon: '🎉',
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
    };

    const handleNewOrder = (order: any) => {
      const notification: Notification = {
        id: `order-${order._id}-${Date.now()}`,
        type: 'order',
        title: 'Order Placed Successfully!',
        message: `Your order #${order._id.slice(-8).toUpperCase()} has been placed`,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    };

    const handleOrderStatusUpdate = (data: { orderId: string; status: string; order: any }) => {
      const notification: Notification = {
        id: `order-update-${data.orderId}-${Date.now()}`,
        type: 'order',
        title: 'Order Status Updated',
        message: `Order #${data.orderId.slice(-8).toUpperCase()} status updated to ${data.status}`,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    };

    const handleProductCreated = (product: any) => {
      const notification: Notification = {
        id: `product-${product._id}-${Date.now()}`,
        type: 'product',
        title: 'New Product Available!',
        message: `Check out the new product: ${product.name}`,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
    };

    // Listen for events
    socket.on('coupon:created', handleCouponCreated);
    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleOrderStatusUpdate);
    socket.on('product:created', handleProductCreated);

    return () => {
      socket.off('coupon:created', handleCouponCreated);
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleOrderStatusUpdate);
      socket.off('product:created', handleProductCreated);
    };
  }, [socket]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
