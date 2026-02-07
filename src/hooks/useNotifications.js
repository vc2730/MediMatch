/**
 * React Hook for Notifications
 */

import { useState, useEffect } from 'react';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/database';

/**
 * Get user notifications with real-time updates
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToUserNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  };
};
