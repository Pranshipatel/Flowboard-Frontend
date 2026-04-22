import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../core/api/auth.api.service';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css'],
})
export class RegisterPageComponent {
  email = '';
  password = '';
  message: string | null = null;
  error: string | null = null;
  loading = false;

  constructor(private api: AuthApiService, private router: Router) {}

  onSubmit() {
    if (this.loading) return;

    this.message = null;
    this.error = null;
    this.loading = true;

    this.api.register({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.message = 'Registered successfully. You can login now.';
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (e) => {
        this.error = e?.error || 'Register failed';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}