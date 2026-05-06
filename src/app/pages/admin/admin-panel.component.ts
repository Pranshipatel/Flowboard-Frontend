import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import * as AdminActions from '../../store/admin/admin.actions';
import * as AdminSelectors from '../../store/admin/admin.selectors';
import * as AuthActions from '../../store/auth/auth.actions';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent implements OnInit {
  private store = inject(Store);

  searchQuery$ = new BehaviorSubject<string>('');

  users$ = combineLatest([
    this.store.select(AdminSelectors.selectAdminUsers),
    this.searchQuery$
  ]).pipe(
    map(([users, query]) => {
      const filtered = users?.filter(u => u.role !== 'PLATFORM_ADMIN') || [];
      if (!query) return filtered;
      const q = query.toLowerCase();
      return filtered.filter(u => 
        u.fullName.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    })
  );
  stats$   = this.store.select(AdminSelectors.selectAdminStats);
  loading$ = this.store.select(AdminSelectors.selectAdminLoading);

  userColumns = ['avatar', 'name', 'email', 'role', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(AdminActions.loadAdminStats());
    this.store.dispatch(AdminActions.loadAllUsers());
  }

  selectedUserForProfile: any = null;

  openUserProfile(user: any): void {
    this.selectedUserForProfile = user;
  }
  
  closeUserProfile(): void {
    this.selectedUserForProfile = null;
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery$.next(value);
  }

  loadAllUsers(): void {
    this.store.dispatch(AdminActions.loadAllUsers());
  }

  changeRole(userId: number, role: string): void {
    this.store.dispatch(AdminActions.updateUserRole({ userId, role }));
  }

  suspendUser(userId: number): void {
    this.store.dispatch(AdminActions.suspendUser({ userId }));
  }

  reactivateUser(userId: number): void {
    this.store.dispatch(AdminActions.reactivateUser({ userId }));
  }

  toggleUserStatus(user: any): void {
    if (user.active) {
      this.suspendUser(user.id);
    } else {
      this.reactivateUser(user.id);
    }
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to permanently delete this user?')) {
      this.store.dispatch(AdminActions.deleteUser({ userId }));
    }
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
