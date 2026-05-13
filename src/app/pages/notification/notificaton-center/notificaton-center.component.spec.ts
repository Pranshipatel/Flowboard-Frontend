import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { NotificationCenterComponent } from './notificaton-center.component';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let paymentStatus$: BehaviorSubject<string>;
  let unreadCount$: BehaviorSubject<number>;
  let notificationService: jasmine.SpyObj<NotificationService> & { unreadCount$: BehaviorSubject<number> };

  beforeEach(async () => {
    paymentStatus$ = new BehaviorSubject<string>('FREE');
    unreadCount$ = new BehaviorSubject<number>(0);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'getNotifications',
      'markAsRead',
      'markAllAsRead',
      'delete',
      'deleteRead',
      'refreshUnreadCount'
    ]) as jasmine.SpyObj<NotificationService> & { unreadCount$: BehaviorSubject<number> };
    notificationService.unreadCount$ = unreadCount$;
    notificationService.getNotifications.and.returnValue(of([]));
    notificationService.markAsRead.and.returnValue(of({} as any));
    notificationService.markAllAsRead.and.returnValue(of('ok'));
    notificationService.delete.and.returnValue(of({} as any));
    notificationService.deleteRead.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentService, useValue: { subscriptionStatus: paymentStatus$ } },
        { provide: NotificationService, useValue: notificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications and refresh unread count for premium users', () => {
    const notifications = [{ id: 1, isRead: false, type: 'DUE_DATE' }] as any;
    notificationService.getNotifications.and.returnValue(of(notifications));

    fixture.detectChanges();
    paymentStatus$.next('BUSINESS');
    unreadCount$.next(3);

    expect(component.isPremium).toBeTrue();
    expect(component.notifications).toEqual(notifications);
    expect(component.unreadCount).toBe(3);
    expect(notificationService.refreshUnreadCount).toHaveBeenCalled();
  });

  it('should mark a notification as read and revert when the service fails', () => {
    const notification = { id: 10, isRead: false } as any;
    component.unreadCount = 1;
    notificationService.markAsRead.and.returnValue(throwError(() => new Error('failed')));

    component.markAsRead(notification);

    expect(notification.isRead).toBeFalse();
    expect(component.unreadCount).toBe(1);
  });

  it('should skip already-read notifications', () => {
    const notification = { id: 10, isRead: true } as any;

    component.markAsRead(notification);

    expect(notificationService.markAsRead).not.toHaveBeenCalled();
  });

  it('should mark all as read and ignore empty unread state', () => {
    component.notifications = [{ id: 1, isRead: false }] as any;
    component.unreadCount = 0;

    component.markAllAsRead();
    expect(notificationService.markAllAsRead).not.toHaveBeenCalled();

    component.unreadCount = 1;
    component.markAllAsRead();
    expect(component.notifications[0].isRead).toBeTrue();
    expect(component.unreadCount).toBe(0);
  });

  it('should delete one notification and all read notifications', () => {
    const event = jasmine.createSpyObj<Event>('event', ['stopPropagation']);
    component.notifications = [{ id: 1, isRead: false }, { id: 2, isRead: true }] as any;
    component.unreadCount = 1;

    component.deleteNotification(event, 1);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(component.notifications.map(notification => notification.id)).toEqual([2]);
    expect(component.unreadCount).toBe(0);

    component.deleteAllRead();
    expect(component.notifications).toEqual([]);
    expect(notificationService.deleteRead).toHaveBeenCalled();
  });

  it('should map notification types to icons', () => {
    expect(component.getTypeIcon('ASSIGNMENT')).toBe('person_add');
    expect(component.getTypeIcon('DUE_DATE')).toBe('event');
    expect(component.getTypeIcon('OVERDUE')).toBe('error');
    expect(component.getTypeIcon('COMMENT')).toBe('comment');
    expect(component.getTypeIcon('OTHER')).toBe('notifications');
  });
});
