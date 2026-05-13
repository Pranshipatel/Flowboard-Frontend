import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { NotificationDropdownComponent } from './notification-dropdown.component';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';

describe('NotificationDropdownComponent', () => {
  let component: NotificationDropdownComponent;
  let fixture: ComponentFixture<NotificationDropdownComponent>;
  let paymentStatus$: BehaviorSubject<string>;
  let unreadCount$: BehaviorSubject<number>;
  let paymentService: jasmine.SpyObj<PaymentService> & { subscriptionStatus: BehaviorSubject<string> };
  let notificationService: jasmine.SpyObj<NotificationService> & { unreadCount$: BehaviorSubject<number> };

  beforeEach(async () => {
    paymentStatus$ = new BehaviorSubject<string>('FREE');
    unreadCount$ = new BehaviorSubject<number>(0);
    paymentService = jasmine.createSpyObj<PaymentService>('PaymentService', ['checkPremiumUsage']) as jasmine.SpyObj<PaymentService> & { subscriptionStatus: BehaviorSubject<string> };
    paymentService.subscriptionStatus = paymentStatus$;
    paymentService.checkPremiumUsage.and.returnValue(true);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'getNotifications',
      'markAsRead',
      'markAllAsRead',
      'delete',
      'deleteRead',
      'refreshNotifications',
      'refreshUnreadCount'
    ]) as jasmine.SpyObj<NotificationService> & { unreadCount$: BehaviorSubject<number> };
    notificationService.unreadCount$ = unreadCount$;
    notificationService.getNotifications.and.returnValue(of([]));
    notificationService.markAsRead.and.returnValue(of({} as any));
    notificationService.markAllAsRead.and.returnValue(of('ok'));
    notificationService.delete.and.returnValue(of({} as any));
    notificationService.deleteRead.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [NotificationDropdownComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentService, useValue: paymentService },
        { provide: NotificationService, useValue: notificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDropdownComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications when premium status is active', () => {
    const notifications = [{ id: 1, isRead: false, type: 'COMMENT', message: 'New comment' }] as any;
    notificationService.getNotifications.and.returnValue(of(notifications));

    fixture.detectChanges();
    paymentStatus$.next('PREMIUM');

    expect(component.isPremium).toBeTrue();
    expect(component.hasAccess).toBeTrue();
    expect(component.notifications).toEqual(notifications);
    expect(component.isLoading).toBeFalse();
  });

  it('should block dropdown access when free usage is exhausted', () => {
    paymentService.checkPremiumUsage.and.returnValue(false);

    component.openDropdown();

    expect(component.hasAccess).toBeFalse();
    expect(notificationService.getNotifications).not.toHaveBeenCalled();
  });

  it('should mark unread notifications as read and revert on failure', () => {
    const notification = { id: 7, isRead: false } as any;
    component.unreadCount = 2;
    notificationService.markAsRead.and.returnValue(throwError(() => new Error('failed')));

    component.markAsRead(notification);

    expect(notification.isRead).toBeFalse();
    expect(component.unreadCount).toBe(2);
  });

  it('should mark all notifications as read and delete read notifications', () => {
    component.notifications = [{ id: 1, isRead: false }, { id: 2, isRead: true }] as any;
    component.unreadCount = 1;

    component.markAllAsRead();
    expect(component.notifications.every(notification => notification.isRead)).toBeTrue();
    expect(component.unreadCount).toBe(0);
    expect(notificationService.markAllAsRead).toHaveBeenCalled();

    component.deleteAllRead();
    expect(component.notifications).toEqual([]);
    expect(notificationService.deleteRead).toHaveBeenCalled();
  });

  it('should format icons and messages for display', () => {
    expect(component.getTypeIcon('ASSIGNMENT')).toBe('person_add');
    expect(component.getTypeIcon('DUE_DATE')).toBe('event');
    expect(component.getTypeIcon('OVERDUE')).toBe('error');
    expect(component.getTypeIcon('COMMENT')).toBe('comment');
    expect(component.getTypeIcon('OTHER')).toBe('notifications');
    expect(component.formatMessage("Added 'Task' as MEMBER")).toContain("<b>'Task'</b>");
    expect(component.formatMessage('')).toBe('');
  });
});
