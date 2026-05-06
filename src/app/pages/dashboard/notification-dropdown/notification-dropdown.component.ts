import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Notification } from '../../../core/models/notification.model';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UpgradePromptComponent } from '../../../shared/components/upgrade-prompt.component';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-notification-dropdown',
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
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './notification-dropdown.component.html',
  styleUrl: './notification-dropdown.component.css'
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private notificationService = inject(NotificationService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild(MatMenuTrigger) trigger!: MatMenuTrigger;

  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  isPremium = false;
  hasAccess = false; // true if premium OR has free usage left

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Subscribe to premium status
    this.paymentService.subscriptionStatus.pipe(takeUntil(this.destroy$)).subscribe(status => {
      this.isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS';
      if (this.isPremium) {
        this.hasAccess = true;
        this.loadNotifications();
      }
    });

    // Subscribe to unread count stream
    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.unreadCount = count;
    });
  }

  openDropdown(): void {
    if (!this.isPremium && !this.paymentService.checkPremiumUsage('notification')) {
       this.hasAccess = false;
       return;
    }
    this.hasAccess = true;
    this.loadNotifications();
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
    n.isRead = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.notificationService.markAsRead(n.id).subscribe({
      error: () => {
        n.isRead = false;
        this.unreadCount++;
        this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
      }
    });
  }

  markAllAsRead(): void {
    if (this.unreadCount === 0) return;
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.snackBar.open('All notifications marked as read', 'Close', { duration: 3000 });
      },
      error: () => {
        this.notificationService.refreshNotifications(); 
        this.notificationService.refreshUnreadCount();
        this.snackBar.open('Failed to mark all as read', 'Close', { duration: 3000 });
      }
    });
  }

  deleteNotification(event: Event, id: number): void {
    event.stopPropagation();
    const nIndex = this.notifications.findIndex(n => n.id === id);
    if (nIndex === -1) return;
    const n = this.notifications[nIndex];
    this.notifications.splice(nIndex, 1);
    if (!n.isRead) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
    this.notificationService.delete(id).subscribe({
      error: () => {
        this.notificationService.refreshNotifications();
        this.notificationService.refreshUnreadCount();
        this.snackBar.open('Failed to delete notification', 'Close', { duration: 3000 });
      }
    });
  }

  deleteAllRead(): void {
    this.notifications = this.notifications.filter(n => !n.isRead);
    this.notificationService.deleteRead().subscribe({
      next: () => {
        this.snackBar.open('Read notifications deleted', 'Close', { duration: 3000 });
      },
      error: () => {
        this.notificationService.refreshNotifications();
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
