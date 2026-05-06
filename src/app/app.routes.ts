import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { subscriptionGuard } from './core/guards/subscription.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'guest', pathMatch: 'full' },
  {
    path: 'guest',
    loadComponent: () => import('./pages/guest/guest.component').then(m => m.GuestComponent)
  },
  {
    path: 'guest/board/:id',
    loadComponent: () => import('./pages/board/board-view/board-view.component').then(m => m.BoardViewComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./pages/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'oauth2/callback',
    loadComponent: () => import('./pages/auth/oauth2-callback/oauth2-callback.component').then(m => m.Oauth2CallbackComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-panel.component').then(m => m.AdminPanelComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/main-layout/main.layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'public-workspaces',
        loadComponent: () => import('./pages/public-workspaces/public-workspaces.component').then(m => m.PublicWorkspacesComponent)
      },
      {
        path: 'workspace/:id',
        loadComponent: () => import('./pages/workspace/workspace-detail/workspace-detail.component').then(m => m.WorkspaceDetailComponent)
      },
      {
        path: 'workspace/:id/member/:userId',
        loadComponent: () => import('./pages/workspace/workspace-member-detail/workspace-member-detail.component').then(m => m.WorkspaceMemberDetailComponent)
      },
      {
        path: 'board/:id',
        loadComponent: () => import('./pages/board/board-view/board-view.component').then(m => m.BoardViewComponent)
      },
      {
        path: 'notifications',
        canActivate: [subscriptionGuard],
        loadComponent: () => import('./pages/notification/notificaton-center/notificaton-center.component').then(m => m.NotificationCenterComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
      },
      {
        path: 'upgrade',
        loadComponent: () => import('./pages/payment/upgrade/upgrade.component').then(m => m.UpgradeComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'guest' }
];
