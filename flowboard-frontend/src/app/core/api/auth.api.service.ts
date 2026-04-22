import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  LoginUserDto,
  RegisterUserDto,
  JwtTokenResponse,
  UserProfileDto,
  UpdateUserProfileDto,
} from '../models/auth.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private base = `${environment.apiBaseUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  register(dto: RegisterUserDto): Observable<any> {
    return this.http.post(`${this.base}/register`, dto);
  }

  login(dto: LoginUserDto): Observable<JwtTokenResponse> {
    return this.http.post(`${this.base}/login`, dto, { responseType: 'text' as const });
  }

  refresh(token: string): Observable<JwtTokenResponse> {
    // backend expects Authorization header string
    return this.http.post(`${this.base}/refresh`, null, {
      headers: { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` },
      responseType: 'text' as const,
    });
  }

  profile(userId: number): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.base}/profile/${userId}`);
  }

  updateProfile(userId: number, dto: UpdateUserProfileDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.base}/profile/${userId}`, dto);
  }

  changePassword(userId: number, dto: { oldPassword: string; newPassword: string }): Observable<string> {
    return this.http.put(`${this.base}/change-password/${userId}`, dto, { responseType: 'text' });
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post(`${this.base}/forgot-password`, { email }, { responseType: 'text' });
  }

  resetPassword(token: string, password: string): Observable<string> {
    const params = new HttpParams().set('token', token);
    return this.http.post(`${this.base}/reset-password`, { password }, { params, responseType: 'text' });
  }

  // OAuth2: just redirect browser to gateway (backend handles OAuth)
  oauthGoogleUrl(): string {
    return `${environment.apiBaseUrl}/oauth2/authorization/google`;
  }

  oauthGithubUrl(): string {
    return `${environment.apiBaseUrl}/oauth2/authorization/github`;
  }
}