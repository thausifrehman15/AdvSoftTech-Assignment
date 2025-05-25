import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isCurrent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private currentSubscription = 'free';

  constructor() {
    // Load saved subscription from localStorage
    const savedSubscription = localStorage.getItem('currentSubscription');
    if (savedSubscription) {
      this.currentSubscription = savedSubscription;
    }
  }

  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        billingCycle: 'monthly',
        features: [
          'Single Line Predictions',
          'Basic Result History',
          'Standard Support'
        ],
        isCurrent: this.currentSubscription === 'free'
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        price: 19.99,
        billingCycle: 'monthly',
        features: [
          'Single Line Predictions',
          'Bulk CSV Predictions',
          'Advanced Analytics',
          'Priority Support',
          'Unlimited History'
        ],
        isCurrent: this.currentSubscription === 'pro'
      }
    ];
  }

  getCurrentSubscription(): string {
    return this.currentSubscription;
  }

  setSubscription(plan: string): void {
    this.currentSubscription = plan;
    // Save to localStorage for persistence
    localStorage.setItem('currentSubscription', plan);
  }

  hasBulkAccess(): boolean {
    return this.currentSubscription === 'pro';
  }

  processPurchase(planId: string, paymentDetails: any): Observable<boolean> {
    // Simulate API call with a delay
    return of(true).pipe(
      delay(1500),
      tap(() => {
        this.setSubscription(planId);
      })
    );
  }
}