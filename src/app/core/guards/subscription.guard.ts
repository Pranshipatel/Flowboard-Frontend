import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PaymentService } from '../services/payment.service';

export const subscriptionGuard: CanActivateFn = () => {
  const paymentService = inject(PaymentService);
  const router         = inject(Router);

  const status = paymentService.subscriptionStatus.value;
  const isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS'
                    || paymentService.isPaidPlan();

  if (isPremium) return true;

  // Redirect free users to the beautiful upgrade page
  router.navigate(['/upgrade']);
  return false;
};
