import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/notifications`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.base);
  }

  // Alias for backward compatibility
  getAll(): Observable<Notification[]> {
    return this.getNotifications();
  }

  getUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(
      `${this.base}/unread`
    );
  }

  refreshUnreadCount(): void {
    this.http.get<number>(`${this.base}/unread/count`).subscribe({
      next: c => this._unreadCount.next(c),
      error: () => {}
    });
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(
      `${this.base}/${id}/read`,
      {}
    );
  }

  markAllAsRead(): Observable<string> {
    return this.http.put(
      `${this.base}/read/all`,
      {},
      { responseType: 'text' }
    );
  }

  delete(id: number): Observable<string> {
    return this.http.delete(
      `${this.base}/${id}`,
      { responseType: 'text' }
    );
  }

  deleteRead(): Observable<string> {
    return this.http.delete(
      `${this.base}/read/all`,
      { responseType: 'text' }
    );
  }
}