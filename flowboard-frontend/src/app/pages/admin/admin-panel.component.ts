import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import * as AdminActions from '../../store/admin/admin.actions';
import * as AdminSelectors from '../../store/admin/admin.selectors';

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

  users$   = this.store.select(AdminSelectors.selectAdminUsers);
  stats$   = this.store.select(AdminSelectors.selectAdminStats);
  loading$ = this.store.select(AdminSelectors.selectAdminLoading);

  userColumns = ['avatar', 'name', 'email', 'role', 'actions'];

  ngOnInit(): void {
    this.store.dispatch(AdminActions.loadAdminStats());
    this.store.dispatch(AdminActions.loadAllUsers());
  }

  changeRole(userId: number, role: string): void {
    this.store.dispatch(AdminActions.updateUserRole({ userId, role }));
  }
}
