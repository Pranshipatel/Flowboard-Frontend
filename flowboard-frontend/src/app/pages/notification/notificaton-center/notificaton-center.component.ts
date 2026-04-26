import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';

import * as NotificationActions from '../../../store/notification/notification.actions';
import * as NotificationSelectors from '../../../store/notification/notification.selectors';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatButtonModule, 
    MatIconModule, 
    MatMenuModule, 
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './notificaton-center.component.html',
  styleUrl: './notificaton-center.component.css'
})
export class NotificationCenterComponent implements OnInit {
  private store = inject(Store);

  notifications$: Observable<Notification[]> = this.store.select(NotificationSelectors.selectAllNotifications);
  unreadCount$:   Observable<number>        = this.store.select(NotificationSelectors.selectUnreadCount);
  loading$:       Observable<boolean>       = this.store.select(NotificationSelectors.selectNotificationLoading);

  ngOnInit(): void {
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  markAsRead(n: Notification): void {
    if (!n.isRead) {
      this.store.dispatch(NotificationActions.markAsRead({ id: n.id }));
    }
  }

  getTypeIcon(type: string): string {
    switch(type) {
      case 'ASSIGNMENT': return 'person_add';
      case 'DUE_DATE': return 'event';
      case 'OVERDUE': return 'error';
      case 'COMMENT': return 'comment';
      default: return 'notifications';
    }
  }
}
