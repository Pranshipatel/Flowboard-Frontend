import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/user.model';

interface JwtPayload { userId?: string | number; role?: string; email?: string; exp?: number; iat?: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private base   = `${environment.apiBaseUrl}/auth`;

  register(data: RegisterRequest): Observable<AuthResponse> { return this.http.post<AuthResponse>(`${this.base}/register`, data); }
  verifyEmail(email: string, otp: string): Observable<string> { return this.http.post(`${this.base}/verify-email`, { email, otp }, { responseType: 'text' }); }
  resendVerification(email: string): Observable<string> { return this.http.post(`${this.base}/resend-verification?email=${email}`, {}, { responseType: 'text' }); }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, data).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          const payload = this.decodePayload(res.token);
          localStorage.setItem('userId', String(payload.userId ?? ''));
          localStorage.setItem('userRole', payload.role ?? 'MEMBER');
        }
      })
    );
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}, { responseType: 'text' }).subscribe({ error: () => {} });
    localStorage.clear();
    this.router.navigate(['/guest']);
  }

  forgotPassword(email: string): Observable<string> { return this.http.post(`${this.base}/forgot-password`, { email }, { responseType: 'text' }); }
  resetPassword(email: string, otp: string, newPassword: string): Observable<string> { return this.http.post(`${this.base}/reset-password`, { email, otp, newPassword }, { responseType: 'text' }); }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.base}/profile`).pipe(
      tap(user => {
        localStorage.setItem('userId', String(user.id));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.fullName);
      })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<string> {
    return this.http.put(`${this.base}/profile`, data, { responseType: 'text' }).pipe(
      tap(() => this.getProfile().subscribe({ error: () => {} }))
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<string> { return this.http.put(`${this.base}/password`, data, { responseType: 'text' }); }

  /** Search users by keyword (name, email, username). */
  searchUsers(key: string): Observable<UserProfile[]> { return this.http.get<UserProfile[]>(`${this.base}/search?key=${encodeURIComponent(key)}`); }

  /** Get a single user by ID (for member detail page). */
  getUserById(id: number): Observable<UserProfile> { return this.http.get<UserProfile>(`${this.base}/users/${id}`); }

  isLoggedIn(): boolean { return !!localStorage.getItem('token'); }
  getToken(): string | null { return localStorage.getItem('token'); }
  getUserId(): number { return Number(localStorage.getItem('userId')); }
  getRole(): string { return localStorage.getItem('userRole') ?? 'MEMBER'; }
  isAdmin(): boolean { return this.getRole() === 'PLATFORM_ADMIN'; }

  private decodePayload(token: string): JwtPayload {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return {}; }
  }
}
