import { createAction, props } from '@ngrx/store';
import { Notification } from '../../core/models/notification.model';

export const loadNotifications = createAction('[Notification] Load Notifications');
export const loadNotificationsSuccess = createAction(
  '[Notification] Load Notifications Success',
  props<{ notifications: Notification[] }>()
);
export const loadNotificationsFailure = createAction(
  '[Notification] Load Notifications Failure',
  props<{ error: string }>()
);

export const markAsRead = createAction(
  '[Notification] Mark As Read',
  props<{ id: number }>()
);

export const markAllAsRead = createAction('[Notification] Mark All As Read');

export const addNotification = createAction(
  '[Notification] Add Notification',
  props<{ notification: Notification }>()
);
