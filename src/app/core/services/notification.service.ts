import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private base = `${environment.apiBaseUrl}/notifications`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': String(this.authService.getUserId() || '')
    });
  }

  // POST /send
  sendNotification(data: any): Observable<Notification> {
    return this.http.post<Notification>(`${this.base}/send`, data, { headers: this.getHeaders() }).pipe(
      tap(res => console.log('[NotificationService] Sent notification', res)),
      catchError(err => {
        console.error('[NotificationService] Error sending notification', err);
        return throwError(() => err);
      })
    );
  }

  // GET /
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.base, { headers: this.getHeaders() }).pipe(
      tap(res => console.log('[NotificationService] Fetched notifications', res.length)),
      catchError(err => {
        console.error('[NotificationService] Error fetching notifications', err);
        return of([]);
      })
    );
  }

  // Alias
  getAll(): Observable<Notification[]> {
    return this.getNotifications();
  }

  // GET /unread
  getUnread(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.base}/unread`, { headers: this.getHeaders() }).pipe(
      tap(res => console.log('[NotificationService] Fetched unread notifications', res.length)),
      catchError(err => {
        console.error('[NotificationService] Error fetching unread', err);
        return of([]);
      })
    );
  }

  // GET /unread/count
  refreshUnreadCount(): void {
    if (!this.authService.getUserId()) return;
    this.http.get<number>(`${this.base}/unread/count`, { headers: this.getHeaders() }).subscribe({
      next: c => this._unreadCount.next(c),
      error: err => console.error('[NotificationService] Error refreshing unread count', err)
    });
  }

  // PUT /{id}/read
  markAsRead(id: number): Observable<Notification> {
    return this.http.put<Notification>(`${this.base}/${id}/read`, {}, { headers: this.getHeaders() }).pipe(
      tap(res => console.log(`[NotificationService] Marked ${id} as read`, res)),
      catchError(err => {
        console.error(`[NotificationService] Error marking ${id} as read`, err);
        return throwError(() => err);
      })
    );
  }

  // PUT /read/all
  markAllAsRead(): Observable<string> {
    return this.http.put(`${this.base}/read/all`, {}, { headers: this.getHeaders(), responseType: 'text' }).pipe(
      tap(res => console.log('[NotificationService] Marked all as read', res)),
      catchError(err => {
        console.error('[NotificationService] Error marking all as read', err);
        return throwError(() => err);
      })
    );
  }

  // DELETE /{id}
  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { headers: this.getHeaders(), responseType: 'text' }).pipe(
      tap(res => console.log(`[NotificationService] Deleted ${id}`, res)),
      catchError(err => {
        console.error(`[NotificationService] Error deleting ${id}`, err);
        return throwError(() => err);
      })
    );
  }

  // DELETE /read/all
  deleteRead(): Observable<string> {
    return this.http.delete(`${this.base}/read/all`, { headers: this.getHeaders(), responseType: 'text' }).pipe(
      tap(res => console.log('[NotificationService] Deleted read notifications', res)),
      catchError(err => {
        console.error('[NotificationService] Error deleting read notifications', err);
        return throwError(() => err);
      })
    );
  }
}