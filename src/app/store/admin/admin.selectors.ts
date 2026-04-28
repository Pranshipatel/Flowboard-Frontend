import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from './admin.state';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

export const selectAdminUsers = createSelector(
  selectAdminState,
  (state: AdminState) => state.users
);

export const selectAdminStats = createSelector(
  selectAdminState,
  (state: AdminState) => state.stats
);

export const selectAdminLoading = createSelector(
  selectAdminState,
  (state: AdminState) => state.loading
);
