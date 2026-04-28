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
}
