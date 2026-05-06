import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as AdminActions from './admin.actions';

@Injectable()
export class AdminEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/admin`;

  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminStats),
      switchMap(() =>
        this.http.get(`${this.base}/stats`).pipe(
          map(stats => AdminActions.loadAdminStatsSuccess({ stats })),
          catchError(error => of(AdminActions.loadAdminStatsFailure({ error: error.error?.message || 'Failed to load admin stats' })))
        )
      )
    )
  );

  loadAllUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAllUsers),
      switchMap(() =>
        this.http.get<any[]>(`${this.base}/users`).pipe(
          map(users => AdminActions.loadAllUsersSuccess({ users })),
          catchError(error => of(AdminActions.loadAllUsersFailure({ error: error.error?.message || 'Failed to load users' })))
        )
      )
    )
  );


  updateUserRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateUserRole),
      switchMap(({ userId, role }) =>
        this.http.put(`${this.base}/users/${userId}/role?role=${role}`, {}, { responseType: 'text' }).pipe(
          map(() => AdminActions.loadAllUsers()),
          catchError(error => {
            console.error('Failed to update role', error);
            return of(AdminActions.loadAllUsersFailure({ error: 'Failed to update role' }));
          })
        )
      )
    )
  );

  suspendUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.suspendUser),
      switchMap(({ userId }) =>
        this.http.put(`${this.base}/users/${userId}/suspend`, {}, { responseType: 'text' }).pipe(
          map(() => AdminActions.loadAllUsers()),
          catchError(error => {
            console.error('Failed to suspend user', error);
            return of(AdminActions.loadAllUsersFailure({ error: 'Failed to suspend user' }));
          })
        )
      )
    )
  );

  reactivateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.reactivateUser),
      switchMap(({ userId }) =>
        this.http.put(`${this.base}/users/${userId}/reactivate`, {}, { responseType: 'text' }).pipe(
          map(() => AdminActions.loadAllUsers()),
          catchError(error => {
            console.error('Failed to reactivate user', error);
            return of(AdminActions.loadAllUsersFailure({ error: 'Failed to reactivate user' }));
          })
        )
      )
    )
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deleteUser),
      switchMap(({ userId }) =>
        this.http.delete(`${this.base}/users/${userId}`, { responseType: 'text' }).pipe(
          map(() => AdminActions.loadAllUsers()),
          catchError(error => {
            console.error('Failed to delete user', error);
            return of(AdminActions.loadAllUsersFailure({ error: 'Failed to delete user' }));
          })
        )
      )
    )
  );
}
