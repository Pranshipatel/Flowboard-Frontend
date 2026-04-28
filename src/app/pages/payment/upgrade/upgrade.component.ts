import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './upgrade.component.html',
  styleUrls: ['./upgrade.component.css']
})
export class UpgradeComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private authService    = inject(AuthService);
  private snackBar       = inject(MatSnackBar);
  private router         = inject(Router);

  isLoading = false;
  isPremium = false;

  ngOnInit(): void {
    // Check current subscription status
    const status = this.paymentService.subscriptionStatus.value;
    this.isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS'
                     || this.paymentService.isPaidPlan();

    // Reload fresh status from backend
    const userId = this.authService.getUserId();
    if (userId) {
      this.paymentService.getSubscriptionStatus(userId).subscribe(response => {
        const s = this.paymentService.subscriptionStatus.value;
        this.isPremium = s === 'PREMIUM' || s === 'PRO' || s === 'BUSINESS'
                         || this.paymentService.isPaidPlan();
      });
    }
  }

  goBack(): void {
    window.history.back();
  }

  initiatePayment(): void {
    this.isLoading = true;
    const userId = this.authService.getUserId();
    const amount = 999;

    this.paymentService.createOrder({ userId, amount }).subscribe({
      next: (response: any) => {
        const key = response.keyId || response.key || response.razorpayKey || environment.razorpayKey;
        if (!key || key === 'rzp_test_YOUR_KEY_HERE') {
          this.isLoading = false;
          this.snackBar.open('Payment gateway not configured. Please contact support.', 'Close', { duration: 5000 });
          return;
        }
        const orderId = response.orderId || response.id || response.razorpayOrderId;
        this.openRazorpay(orderId, response.amount, key, userId);
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to initiate payment. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  private openRazorpay(orderId: string, amountPaise: number, keyId: string, userId: number): void {
    const options = {
      key: keyId,
      amount: amountPaise,   // already in paise from Razorpay (e.g. 99900 = ₹999)
      currency: 'INR',
      name: 'Flowboard',
      description: 'Upgrade to Premium — Lifetime Access',
      image: '/assets/logo.png',
      order_id: orderId,
      handler: (response: any) => this.verifyPayment(response, userId),
      prefill: {
        name:  localStorage.getItem('userName')  || '',
        email: localStorage.getItem('userEmail') || '',
      },
      notes: { address: 'Flowboard Premium Upgrade' },
      theme: { color: '#6366F1' },
      modal: {
        ondismiss: () => {
          this.isLoading = false;
          this.snackBar.open('Payment cancelled.', 'Close', { duration: 3000 });
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Payment failed: ' + response.error.description, 'Close', { duration: 4000 });
      });
      rzp.open();
    } catch {
      this.isLoading = false;
      this.snackBar.open('Payment gateway could not be loaded. Please refresh and try again.', 'Close', { duration: 4000 });
    }
  }

  private verifyPayment(paymentResponse: any, userId: number): void {
    const payload = {
      userId,
      razorpayOrderId:   paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature
    };

    this.paymentService.verifyPayment(payload).subscribe({
      next: () => {
        this.paymentService.getSubscriptionStatus(userId).subscribe(() => {
          this.isLoading = false;
          this.isPremium = true;
          this.snackBar.open('🎉 Welcome to Premium! All features are now unlocked.', 'Close', { duration: 6000 });
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Payment verification failed. Please contact support with your payment ID.', 'Close', { duration: 6000 });
      }
    });
  }
}
