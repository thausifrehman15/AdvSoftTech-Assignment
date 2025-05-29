import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../environment/environment';
import { HttpClient } from '@angular/common/http';

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
  private backendSubscriptionStatus: boolean = false;

  constructor(private http: HttpClient) {
    // Load saved subscription from localStorage
    const savedSubscription = localStorage.getItem('currentSubscription');
    if (savedSubscription) {
      this.currentSubscription = savedSubscription;
    }
    // Check backend status on initialization
    this.checkBackendSubscriptionStatus();
  }

  /**
   * Check subscription status from backend
   */
  checkBackendSubscriptionStatus(): void {
    const username = localStorage.getItem('username');
    if (!username) {
      console.log('No username found, defaulting to free plan');
      return;
    }

    const apiUrl = environment.apiUrl;
    this.http.get(`${apiUrl}/check-subscription?username=${username}`)
      .subscribe({
        next: (response: any) => {
          console.log('Backend subscription check response:', response);
          this.backendSubscriptionStatus = response.access || false;
          
          // Update local subscription based on backend
          if (this.backendSubscriptionStatus) {
            this.setSubscription('pro');
          } else {
            this.setSubscription('free');
          }
        },
        error: (error) => {
          console.error('Error checking backend subscription:', error);
          // Default to free if backend check fails
          this.backendSubscriptionStatus = false;
          this.setSubscription('free');
        }
      });
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
    
    // Update backend status
    if (plan === 'pro') {
      this.backendSubscriptionStatus = true;
      this.updateBackendSubscription(true);
    } else {
      this.backendSubscriptionStatus = false;
      this.updateBackendSubscription(false);
    }
  }

  hasBulkAccess(): boolean {
    // Check both frontend state and backend status
    const frontendAccess = this.currentSubscription === 'pro';
    console.log('Bulk access check:', {
      frontendSubscription: this.currentSubscription,
      frontendAccess: frontendAccess,
      backendStatus: this.backendSubscriptionStatus,
      finalAccess: frontendAccess && this.backendSubscriptionStatus
    });
    
    return frontendAccess && this.backendSubscriptionStatus;
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

    /**
     * Update backend subscription status
     */
    private updateBackendSubscription(status: boolean): void {
      const username = localStorage.getItem('username');
      if (!username) {
        console.error('No username found for backend update');
        return;
      }

      const apiUrl = environment.apiUrl;
      this.http.post(`${apiUrl}/update-subscription`, {
        username: username,
        subscribed: status
      }).subscribe({
        next: (response) => {
          console.log('Backend subscription updated:', response);
        },
        error: (error) => {
          console.error('Error updating backend subscription:', error);
        }
      });
    }


}