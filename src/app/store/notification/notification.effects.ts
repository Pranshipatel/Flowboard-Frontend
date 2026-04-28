import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import * as NotificationActions from './notification.actions';

@Injectable()
export class NotificationEffects {
  private actions$ = inject(Actions);
  private notificationService = inject(NotificationService);

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.loadNotifications),
      switchMap(() =>
        this.notificationService.getNotifications().pipe(
          map(notifications => NotificationActions.loadNotificationsSuccess({ notifications })),
          catchError(error => of(NotificationActions.loadNotificationsFailure({ error: error.error?.message || 'Failed to load notifications' })))
        )
      )
    )
  );

  markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.markAsRead),
      switchMap(({ id }) =>
        this.notificationService.markAsRead(id).pipe(
          map(() => ({ type: '[Notification] Mark As Read Success' })), // Optional success action
          catchError(() => of({ type: '[Notification] Mark As Read Failure' }))
        )
      )
    ),
    { dispatch: false }
  );
}
