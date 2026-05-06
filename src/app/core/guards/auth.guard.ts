import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  // Allow access if user is authenticated
  if (auth.isLoggedIn()) return true;

  // Redirect to the guest page if not authenticated
  router.navigate(['/guest']);
  return false;

};
