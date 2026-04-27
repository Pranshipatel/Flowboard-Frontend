import { Component, inject } from '@angular/core';
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
export class UpgradeComponent {
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  isLoading = false;

  initiatePayment() {
    this.isLoading = true;
    const userId = this.authService.getUserId();
    const amount = 999; // Amount in INR

    this.paymentService.createOrder({ userId, amount }).subscribe({
      next: (response: any) => {
        const key = response.keyId || response.key || response.razorpayKey || environment.razorpayKey;
        if (!key || key === 'rzp_test_YOUR_KEY_HERE') {
          this.isLoading = false;
          console.error('Order creation succeeded but no key was returned. Response:', response);
          this.snackBar.open('Razorpay test key is missing. Please add it to environment.ts', 'Close', { duration: 5000 });
          return;
        }
        const orderId = response.orderId || response.id || response.razorpayOrderId;
        this.openRazorpay(orderId, response.amount, key, userId);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Order creation failed', err);
        this.snackBar.open('Failed to initiate payment. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  private openRazorpay(orderId: string, amount: number, keyId: string, userId: number) {
    const options = {
      key: keyId,
      amount: amount * 100, // Amount is in currency subunits (paise)
      currency: 'INR',
      name: 'Flowboard',
      description: 'Upgrade to Premium',
      order_id: orderId,
      handler: (response: any) => {
        this.verifyPayment(response, userId);
      },
      prefill: {
        name: localStorage.getItem('userName') || '',
        email: localStorage.getItem('userEmail') || '',
      },
      theme: {
        color: '#4f46e5'
      },
      modal: {
        ondismiss: () => {
          this.isLoading = false;
          this.snackBar.open('Payment cancelled', 'Close', { duration: 3000 });
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.isLoading = false;
        console.error('Payment failed', response.error);
        this.snackBar.open('Payment failed: ' + response.error.description, 'Close', { duration: 3000 });
      });
      rzp.open();
    } catch (error) {
      this.isLoading = false;
      console.error('Razorpay initialization failed. Make sure the script is loaded.', error);
      this.snackBar.open('Payment gateway could not be loaded.', 'Close', { duration: 3000 });
    }
  }

  private verifyPayment(paymentResponse: any, userId: number) {
    const payload = {
      userId: userId,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature
    };

    this.paymentService.verifyPayment(payload).subscribe({
      next: () => {
        // Refresh subscription status
        this.paymentService.getSubscriptionStatus(userId).subscribe(() => {
          this.isLoading = false;
          this.snackBar.open('Payment successful! Welcome to Premium.', 'Close', { duration: 5000 });
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Payment verification failed', err);
        this.snackBar.open('Payment verification failed. Please contact support.', 'Close', { duration: 5000 });
      }
    });
  }
}
