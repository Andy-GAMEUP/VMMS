/**
 * 알림 Hook
 */

import { useNotificationStore } from '@/store/notificationStore';

export function useNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotificationStore();

  return {
    notifications,
    unreadCount,
    hasUnread: unreadCount > 0,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
