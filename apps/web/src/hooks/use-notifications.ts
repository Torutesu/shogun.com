"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, message: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
}

let idCounter = 0;

export function createNotificationStore(): NotificationStore {
  let notifications: Notification[] = [];
  const listeners = new Set<() => void>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function emit() {
    listeners.forEach((l) => l());
  }

  function addNotification(type: NotificationType, message: string) {
    const id = `notif_${++idCounter}_${Date.now()}`;
    const notif: Notification = {
      id,
      type,
      message,
      read: false,
      createdAt: Date.now(),
    };
    notifications = [notif, ...notifications];
    emit();

    // Auto-dismiss non-error after 30s
    if (type !== "error") {
      const timer = setTimeout(() => {
        notifications = notifications.filter((n) => n.id !== id);
        timers.delete(id);
        emit();
      }, 30_000);
      timers.set(id, timer);
    }
  }

  function markRead(id: string) {
    notifications = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    );
    emit();
  }

  function markAllRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    emit();
  }

  function removeNotification(id: string) {
    notifications = notifications.filter((n) => n.id !== id);
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    emit();
  }

  return {
    get notifications() {
      return notifications;
    },
    get unreadCount() {
      return notifications.filter((n) => !n.read).length;
    },
    addNotification,
    markRead,
    markAllRead,
    removeNotification,
  };
}

// Singleton store
let _store: NotificationStore | null = null;

export function getNotificationStore(): NotificationStore {
  if (!_store) {
    _store = createNotificationStore();
  }
  return _store;
}

export function useNotifications(): NotificationStore {
  return getNotificationStore();
}
