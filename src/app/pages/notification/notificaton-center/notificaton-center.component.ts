import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';

import { Notification } from '../../../core/models/notification.model';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';

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
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './notificaton-center.component.html',
  styleUrl: './notificaton-center.component.css'
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);

  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  isPremium = false;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Subscribe to premium status
    this.paymentService.subscriptionStatus.pipe(takeUntil(this.destroy$)).subscribe(status => {
      this.isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS';
      if (this.isPremium) {
        this.loadNotifications();
        this.notificationService.refreshUnreadCount();
      }
    });

    // Subscribe to unread count stream
    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.unreadCount = count;
    });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.getNotifications().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.notifications = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  markAsRead(n: Notification): void {
    if (n.isRead) return;
    
    // Optimistic update
    n.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    
    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {},
      error: () => {
        n.isRead = false; // Revert
        this.unreadCount++;
        this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    
    // Optimistic update
    this.notifications.forEach(n => n.isRead = true);
    const oldCount = this.unreadCount;
    this.unreadCount = 0;

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.snackBar.open('All notifications marked as read', 'Close', { duration: 3000 });
      },
      error: () => {
        this.loadNotifications(); // Reload to revert
        this.notificationService.refreshUnreadCount();
        this.snackBar.open('Failed to mark all as read', 'Close', { duration: 3000 });
      }
    });
  }

  deleteNotification(event: Event, id: number): void {
    event.stopPropagation();
    
    // Optimistic
    const nIndex = this.notifications.findIndex(n => n.id === id);
    if (nIndex === -1) return;
    
    const n = this.notifications[nIndex];
    this.notifications.splice(nIndex, 1);
    if (!n.isRead) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }

    this.notificationService.delete(id).subscribe({
      next: () => {},
      error: () => {
        this.loadNotifications(); // Revert
        this.notificationService.refreshUnreadCount();
        this.snackBar.open('Failed to delete notification', 'Close', { duration: 3000 });
      }
    });
  }

  deleteAllRead(): void {
    // Optimistic
    this.notifications = this.notifications.filter(n => !n.isRead);
    
    this.notificationService.deleteRead().subscribe({
      next: () => {
        this.snackBar.open('Read notifications deleted', 'Close', { duration: 3000 });
      },
      error: () => {
        this.loadNotifications(); // Revert
        this.snackBar.open('Failed to delete read notifications', 'Close', { duration: 3000 });
      }
    });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
