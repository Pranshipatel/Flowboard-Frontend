import { createAction, props } from '@ngrx/store';
import { UserProfile } from '../../core/models/user.model';
import { Workspace } from '../../core/models/workspace.model';
import { Board } from '../../core/models/board.model';

export const loadAdminStats = createAction('[Admin] Load Stats');
export const loadAdminStatsSuccess = createAction(
  '[Admin] Load Stats Success',
  props<{ stats: any }>()
);
export const loadAdminStatsFailure = createAction(
  '[Admin] Load Stats Failure',
  props<{ error: string }>()
);

export const loadAllUsers = createAction('[Admin] Load All Users');
export const loadAllUsersSuccess = createAction(
  '[Admin] Load All Users Success',
  props<{ users: UserProfile[] }>()
);
export const loadAllUsersFailure = createAction(
  '[Admin] Load All Users Failure',
  props<{ error: string }>()
);

export const updateUserRole = createAction(
  '[Admin] Update User Role',
  props<{ userId: number; role: string }>()
);
