import { createReducer, on } from '@ngrx/store';
import { initialNotificationState, notificationAdapter } from './notification.state';
import * as NotificationActions from './notification.actions';

export const notificationReducer = createReducer(
  initialNotificationState,
  on(NotificationActions.loadNotificationsSuccess, (state, { notifications }) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return notificationAdapter.setAll(notifications, { ...state, unreadCount, loading: false });
  }),
  on(NotificationActions.addNotification, (state, { notification }) => {
    const unreadCount = state.unreadCount + (notification.isRead ? 0 : 1);
    return notificationAdapter.addOne(notification, { ...state, unreadCount });
  }),
  on(NotificationActions.markAsRead, (state, { id }) => {
    const notification = state.entities[id];
    const unreadCount = state.unreadCount - (notification && !notification.isRead ? 1 : 0);
    return notificationAdapter.updateOne({ id, changes: { isRead: true } }, { ...state, unreadCount });
  })
);
