import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { UserProfileDto } from '../../core/models/auth.models';
import { AuthApiService } from '../../core/api/auth.api.service';

@Component({
  standalone: true,
  selector: 'app-profile-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent {
  userId = 1;

  profile: UserProfileDto | null = null;
  error: string | null = null;
  loading = false;

  constructor(
    private api: AuthApiService,
    private auth: AuthStateService,
    private router: Router
  ) {}

  loadProfile() {
    if (this.loading) return;

    this.error = null;
    this.profile = null;
    this.loading = true;

    this.api.profile(this.userId).subscribe({
      next: (p) => (this.profile = p),
      error: (e) => (this.error = e?.error || 'Failed to load profile'),
      complete: () => (this.loading = false),
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}