import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Plan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxWorkspaces: number;
  maxBoardsPerWorkspace: number;
  maxMembersPerWorkspace: number;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomFields: boolean;
  hasAutomation: boolean;
}

export interface Subscription {
  id: number;
  planName: string;
  planDisplayName: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomFields: boolean;
  hasAutomation: boolean;
  maxWorkspaces: number;
  maxBoardsPerWorkspace: number;
}

export interface CheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/payments`;

  readonly currentPlan = signal<Subscription | null>(null);
  readonly isPro = signal(false);
  readonly isBusiness = signal(false);

  // Use BehaviorSubject as requested
  public subscriptionStatus = new BehaviorSubject<string>('FREE');

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }

  getSubscription(): Observable<Subscription | null> {
    return this.http.get<Subscription>(`${this.base}/subscription`).pipe(
      tap(sub => {
        // Update local signals based on subscription
        this.currentPlan.set(sub);
        this.isPro.set(sub.planName === 'PRO' && sub.status === 'ACTIVE');
        this.isBusiness.set(sub.planName === 'BUSINESS' && sub.status === 'ACTIVE');
      }),
      catchError(err => {
        console.warn('Could not fetch subscription from /payments/subscription', err);
        return of(null);
      })
    );
  }

  // --- New Razorpay Flow Endpoints ---

  createOrder(data: { userId: number; amount: number }): Observable<any> {
    return this.http.post<any>(
      `${this.base}/create-order`,
      data
    );
  }

  verifyPayment(data: {
    userId: number;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/verify`, data);
  }

  getSubscriptionStatus(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/subscription/status/${userId}`).pipe(
      tap(response => {
        // The backend might return { status: 'PREMIUM' } OR a full Subscription object { planName: 'PREMIUM', status: 'ACTIVE' }
        let newStatus = response.planName || response.status || 'FREE';
        if (response.status === 'ACTIVE' && response.planName) {
           newStatus = response.planName;
        }
        if (newStatus === 'ACTIVE') newStatus = 'PREMIUM'; // Fallback just in case
        this.subscriptionStatus.next(newStatus.toUpperCase());
        
        // Also update the signal so components using currentPlan() update
        this.currentPlan.set(response);
      }),
      catchError(err => {
        console.warn('Could not fetch subscription status', err);
        return of(null);
      })
    );
  }

  // --- End New Razorpay Flow Endpoints ---

  createCheckout(
    planId: number,
    billingCycle: 'MONTHLY' | 'YEARLY'
  ): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(
      `${this.base}/checkout`,
      { planId, billingCycle }
    );
  }

  cancelSubscription(): Observable<string> {
    return this.http.post(`${this.base}/cancel`, {}, { responseType: 'text' });
  }

  hasFeature(feature: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/feature/${feature}`);
  }

  getPaymentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history`);
  }

  // Check if user is on any paid plan
  isPaidPlan(): boolean {
    const plan = this.currentPlan();
    if (plan !== null && plan.planName !== 'FREE' && plan.status === 'ACTIVE') {
      return true;
    }
    // Also check the new BehaviorSubject
    if (this.subscriptionStatus.value === 'PREMIUM' || this.subscriptionStatus.value === 'PRO' || this.subscriptionStatus.value === 'BUSINESS') {
      return true;
    }
    return false;
  }

  // Validate workspace creation limit
  canCreateWorkspace(currentCount: number): boolean {
    const plan = this.currentPlan();

    if (!plan) return currentCount < 3;

    return (
      plan.maxWorkspaces === -1 ||
      currentCount < plan.maxWorkspaces
    );
  }
}