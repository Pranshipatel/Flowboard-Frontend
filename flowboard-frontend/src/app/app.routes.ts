import { Routes } from '@angular/router';

import { LoginPageComponent } from './pages/login/login-page.component';
import { RegisterPageComponent } from './pages/register/register-page.component';
import { ForgotPasswordPageComponent } from './pages/forgot-password/forgot-password-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password/reset-password-page.component';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { authGuard } from './core/auth/auth-guard';
import { OauthCallbackPageComponent } from './pages/oauth-callback/oauth-callback-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'profile' },

  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },

  { path: 'forgot-password', component: ForgotPasswordPageComponent },
  // frontend reset page reads token from query param (token=...)
  { path: 'reset-password', component: ResetPasswordPageComponent },

  { path: 'profile', component: ProfilePageComponent, canActivate: [authGuard] },
  { path: 'oauth/callback', component: OauthCallbackPageComponent },

  { path: '**', redirectTo: 'login' },
];