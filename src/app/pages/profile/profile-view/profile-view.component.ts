import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.css'
})
export class ProfileViewComponent implements OnInit {

  private fb      = inject(FormBuilder);
  private auth    = inject(AuthService);
  private snack   = inject(MatSnackBar);
  readonly payment = inject(PaymentService);
  private router   = inject(Router);

  user: UserProfile | null = null;
  loading        = true;
  savingProfile  = false;
  savingPassword = false;
  hideOld = true;
  hideNew = true;
  error: string | null = null;
  avatarLoadFailed = false;
  originalProfileData: any = null;

  profileForm = this.fb.group({
    fullname:  ['', [Validators.required, Validators.minLength(1)]],
    username:  ['', [
      Validators.required, Validators.minLength(1)
    ]],
    avatarUrl: [''],
    bio:       ['']
  });

  passwordForm = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      console.warn('Profile form is invalid', this.profileForm.errors);
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile = true;
    console.log('Saving profile with data:', this.profileForm.value);

    this.auth.updateProfile(this.profileForm.value as any).subscribe({
      next: () => {
        this.savingProfile = false;
        console.log('Profile updated successfully');
        this.snack.open('Profile updated!', 'Close',
          { duration: 3000 });
        
        // Wait a moment then reload profile to ensure backend has updated
        setTimeout(() => {
          this.loadProfile();
        }, 500);
      },
      error: err => {
        this.savingProfile = false;
        console.error('Profile update failed:', err);
        this.snack.open(
          err.error?.message ?? 'Update failed',
          'Close', { duration: 4000 });
      }
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.avatarLoadFailed = false;
    this.auth.getProfile().subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        this.error = null;
        this.avatarLoadFailed = false;
        
        // Patch the form values with fresh data
        this.profileForm.patchValue({
          fullname:  user.fullName,
          username:  user.username,
          avatarUrl: user.avatarUrl ?? '',
          bio:       user.bio ?? ''
        });
        
        // Store original data to detect changes
        this.originalProfileData = this.profileForm.value;
        
        // Mark form as pristine since we just loaded fresh data
        this.profileForm.markAsPristine();
        
        // Explicitly enable all form controls
        Object.keys(this.profileForm.controls).forEach(key => {
          this.profileForm.get(key)?.enable();
        });
        
        console.log('Profile loaded successfully', user);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loading = false;
        this.error = err?.error?.message ?? 'Failed to load profile';
        this.snack.open(this.error ?? 'Failed to load profile', 'Close', { duration: 5000 });
      }
    });
  }

  hasProfileChanges(): boolean {
    if (!this.originalProfileData || this.profileForm.pristine) {
      return false;
    }
    return JSON.stringify(this.originalProfileData) !== JSON.stringify(this.profileForm.value);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;

    this.auth.changePassword(this.passwordForm.value as any).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.snack.open('Password changed!', 'Close',
          { duration: 3000 });
      },
      error: err => {
        this.savingPassword = false;
        this.snack.open(
          err.error?.message ?? 'Change failed',
          'Close', { duration: 4000 });
      }
    });
  }

  getInitials(): string {
    return (this.user?.fullName ?? 'U')
      .split(' ').map(n => n[0])
      .join('').toUpperCase().slice(0, 2);
  }

  onAvatarError(event: Event): void {
    console.warn('Avatar image failed to load');
    this.avatarLoadFailed = true;
  }

  onAvatarLoad(): void {
    console.log('Avatar image loaded successfully');
    this.avatarLoadFailed = false;
  }

  getAvatarUrl(): string {
    if (!this.user?.avatarUrl || this.avatarLoadFailed) {
      return '';
    }
    // Add cache buster to force image reload
    return this.user.avatarUrl + '?t=' + Date.now();
  }

  getHeaderAvatarUrl(): string {
    if (!this.user?.avatarUrl) {
      return '';
    }
    // No cache buster for header to use browser cache
    return this.user.avatarUrl;
  }
}