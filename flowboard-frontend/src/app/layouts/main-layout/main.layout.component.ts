import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationCenterComponent } from '../../pages/notification/notificaton-center/notificaton-center.component';
import * as AuthSelectors from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatTooltipModule, NotificationCenterComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  readonly authService    = inject(AuthService);
  private store           = inject(Store);
  private paymentService  = inject(PaymentService);
  private router          = inject(Router);

  user$: Observable<UserProfile | null> = this.store.select(AuthSelectors.selectUser);
  isDarkMode = false;

  // Search Implementation
  searchQuery = '';
  isSearchOpen = false;
  
  mockSearchData = [
    { type: 'Context', name: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
    { type: 'Context', name: 'Profile Settings', icon: 'settings', route: '/profile' },
    { type: 'Context', name: 'Calendar Overview', icon: 'calendar_month', route: '/calendar' },
    { type: 'Workspace', name: 'Product Launch 2026', icon: 'assessment', route: '/dashboard' },
    { type: 'Workspace', name: 'Engineering Roadmap', icon: 'build', route: '/dashboard' },
    { type: 'Board', name: 'Sprint 5 Tasks', icon: 'view_kanban', route: '/dashboard' },
  ];

  get filteredSearchResults() {
    if (!this.searchQuery.trim()) return [];
    const q = this.searchQuery.toLowerCase();
    return this.mockSearchData.filter(item => item.name.toLowerCase().includes(q));
  }

  closeSearch() {
    setTimeout(() => { this.isSearchOpen = false; }, 200); // delay allows click to register
  }

  navigateToResult(route: string) {
    this.router.navigate([route]);
    this.isSearchOpen = false;
    this.searchQuery = '';
  }

  planName = computed(() => {
    const p = this.paymentService.currentPlan();
    return p?.planDisplayName ?? 'Free';
  });

  isFreeUser = computed(() => {
    const p = this.paymentService.currentPlan();
    return !p || p.planName === 'FREE';
  });

  ngOnInit() {
    this.store.dispatch(AuthActions.getProfile());
    this.paymentService.getSubscription().subscribe();
    this.isDarkMode = document.body.classList.contains('dark');
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}