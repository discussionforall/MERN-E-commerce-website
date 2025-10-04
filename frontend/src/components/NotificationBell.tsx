import React, { useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // const unreadNotifications = notifications.filter(n => !n.read);
  const recentNotifications = notifications.slice(0, 10); // Show last 10

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'coupon':
        return '🎉';
      case 'order':
        return '📦';
      case 'product':
        return '🛍️';
      default:
        return '🔔';
    }
  };

  // const getNotificationColor = (type: string) => {
  //   switch (type) {
  //     case 'coupon':
  //       return 'text-green-600 bg-green-50';
  //     case 'order':
  //       return 'text-blue-600 bg-blue-50';
  //     case 'product':
  //       return 'text-purple-600 bg-purple-50';
  //     default:
  //       return 'text-gray-600 bg-gray-50';
  //   }
  // };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 text-sm text-red-600">
                      ({unreadCount} new)
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="flex-shrink-0">
                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Remove notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {recentNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Showing {recentNotifications.length} of {notifications.length} notifications
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
