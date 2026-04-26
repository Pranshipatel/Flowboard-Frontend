import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Reducers
import { authReducer } from './store/auth/auth.reducers';
import { workspaceReducer } from './store/workspace/workspace.reducer';
import { boardReducer } from './store/board/board.reducer';
import { notificationReducer } from './store/notification/notification.reducer';
import { adminReducer } from './store/admin/admin.reducer';

// Effects
import { AuthEffects } from './store/auth/auth.effects';
import { WorkspaceEffects } from './store/workspace/workspace.effects';
import { BoardEffects } from './store/board/board.effects';
import { NotificationEffects } from './store/notification/notification.effects';
import { AdminEffects } from './store/admin/admin.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideStore({
      auth: authReducer,
      workspace: workspaceReducer,
      board: boardReducer,
      notification: notificationReducer,
      admin: adminReducer
    }),
    provideEffects([
      AuthEffects,
      WorkspaceEffects,
      BoardEffects,
      NotificationEffects,
      AdminEffects
    ]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode()
    })
  ]
};