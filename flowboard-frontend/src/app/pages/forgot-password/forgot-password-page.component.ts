import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth.api.service';

@Component({
  standalone: true,
  selector: 'app-forgot-password-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrls: ['./forgot-password-page.component.css'],
})
export class ForgotPasswordPageComponent {
  email = '';
  message: string | null = null;
  error: string | null = null;
  loading = false;

  constructor(private api: AuthApiService) {}

  onSubmit() {
    if (this.loading) return;

    this.message = null;
    this.error = null;
    this.loading = true;

    this.api.forgotPassword(this.email).subscribe({
      next: (msg) => (this.message = msg),
      error: (e) => {
        this.error = e?.error || 'Request failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}