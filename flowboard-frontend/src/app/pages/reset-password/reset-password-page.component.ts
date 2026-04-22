import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth.api.service';

@Component({
  standalone: true,
  selector: 'app-reset-password-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.css'],
})
export class ResetPasswordPageComponent {
  token: string | null = null;
  password = '';

  message: string | null = null;
  error: string | null = null;
  loading = false;

  constructor(route: ActivatedRoute, private api: AuthApiService) {
    this.token = route.snapshot.queryParamMap.get('token');
  }

  onSubmit() {
    if (!this.token || this.loading) return;

    this.message = null;
    this.error = null;
    this.loading = true;

    this.api.resetPassword(this.token, this.password).subscribe({
      next: (msg) => (this.message = msg),
      error: (e) => {
        this.error = e?.error || 'Reset failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}