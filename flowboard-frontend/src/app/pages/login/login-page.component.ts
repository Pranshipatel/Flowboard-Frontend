import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { AuthApiService } from '../../core/api/auth.api.service';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(
    private api: AuthApiService,
    private auth: AuthStateService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.loading) return;

    this.error = null;
    this.loading = true;

    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: (token) => {
        this.auth.setToken(token);
        this.router.navigateByUrl('/profile');
      },
      error: (e) => {
        this.error = e?.error || 'Login failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }

  oauthGoogle() {
    window.location.href = this.api.oauthGoogleUrl();
  }

  oauthGithub() {
    window.location.href = this.api.oauthGithubUrl();
  }
}