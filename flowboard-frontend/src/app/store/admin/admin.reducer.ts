import { createReducer, on } from '@ngrx/store';
import { initialAdminState } from './admin.state';
import * as AdminActions from './admin.actions';

export const adminReducer = createReducer(
  initialAdminState,
  on(AdminActions.loadAdminStats, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AdminActions.loadAdminStatsSuccess, (state, { stats }) => ({
    ...state,
    stats,
    loading: false
  })),
  on(AdminActions.loadAllUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  }))
);
