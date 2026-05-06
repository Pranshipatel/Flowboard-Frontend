import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

export const adminGuard = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAuthenticated).pipe(
    take(1),
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
        return of(false);
      }
      
      const role = localStorage.getItem('userRole');
      if (role === 'PLATFORM_ADMIN') {
        return of(true);
      }
      
      router.navigate(['/admin']);
      return of(false);
    })
  );
};
