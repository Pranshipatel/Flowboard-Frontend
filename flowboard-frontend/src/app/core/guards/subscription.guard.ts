import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const paymentService = inject(PaymentService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  if (paymentService.isPaidPlan() || paymentService.subscriptionStatus.value === 'PREMIUM') {
    return true;
  }

  snackBar.open('Upgrade to access this feature', 'Close', { duration: 3000 });
  router.navigate(['/upgrade']);
  return false;
};
