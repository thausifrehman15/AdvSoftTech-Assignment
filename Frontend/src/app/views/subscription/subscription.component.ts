import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  AlertComponent,
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  CardFooterComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  FormFeedbackComponent,
  FormLabelDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  ColComponent,
  BadgeComponent,
  TextColorDirective,
  ModalComponent,
  ModalBodyComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective
} from '@coreui/angular';
import { IconDirective, IconModule, IconSetService } from '@coreui/icons-angular';
import { iconSubset } from '../../icons/icon-subset';
import { 
  cilCheckAlt, 
  cilX, 
  cilLockLocked, 
  cilUser, 
  cilEnvelopeClosed, 
  cilCreditCard,
  cilSun,
  cilBell
} from '@coreui/icons';
import { SubscriptionPlan, SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardComponent,
    CardBodyComponent,
    CardHeaderComponent,
    CardFooterComponent,
    BadgeComponent,
    ButtonDirective,
    FormDirective,
    FormControlDirective,
    FormLabelDirective,
    FormFeedbackComponent,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    IconModule,
    AlertComponent,
    TextColorDirective,
    // We've replaced the modal with custom HTML, but keep these for alerts
    ModalComponent,
    ModalBodyComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective
  ]
})
export class SubscriptionComponent implements OnInit {
  subscriptionPlans: SubscriptionPlan[] = [];
  currentSubscription = 'free';
  showPaymentModal = false;
  selectedPlan: SubscriptionPlan | null = null;
  paymentForm: FormGroup;
  processing = false;
  paymentSuccess = false;
  paymentError = '';

  // Add this property to your component class
  isDarkMode = false;

  constructor(
    private subscriptionService: SubscriptionService,
    private fb: FormBuilder,
    private router: Router,
    private iconSetService: IconSetService
  ) {
    // Use the existing icon subset
    this.iconSetService.icons = { ...iconSubset };
    
    this.paymentForm = this.fb.group({
      cardName: ['', [Validators.required]],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]]
    });
  }

  ngOnInit(): void {
    this.subscriptionPlans = this.subscriptionService.getSubscriptionPlans();
    this.currentSubscription = this.subscriptionService.getCurrentSubscription();
    
    // Check if dark mode is active
    this.isDarkMode = document.body.classList.contains('dark-theme');
    
    // Add listener for theme changes
    document.addEventListener('themeChange', () => {
      this.isDarkMode = document.body.classList.contains('dark-theme');
    });
    
    // Debug log
    console.log('Component initialized, subscription plans:', this.subscriptionPlans);
    console.log('Current subscription:', this.currentSubscription);
    console.log('Dark mode:', this.isDarkMode);
  }

  selectPlan(plan: SubscriptionPlan): void {
    console.log('Plan selected:', plan);
    
    // If plan is free, just subscribe
    if (plan.id === 'free') {
      this.subscriptionService.setSubscription('free');
      this.currentSubscription = 'free';
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);
      return;
    }

    // For paid plans, show payment modal
    this.selectedPlan = plan;
    this.showPaymentModal = true;
    console.log('Payment modal should be visible:', this.showPaymentModal);
    
    // Force change detection
    setTimeout(() => {
      document.body.classList.add('modal-open');
    }, 0);
  }

  closeModal(): void {
    this.showPaymentModal = false;
    this.selectedPlan = null;
    this.paymentForm.reset();
    this.paymentSuccess = false;
    this.paymentError = '';
    document.body.classList.remove('modal-open');
  }

  processPurchase(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.processing = true;
    this.paymentError = '';

    // Mock payment processing
    if (this.selectedPlan) {
      const planId = this.selectedPlan.id;
      this.subscriptionService.processPurchase(planId, this.paymentForm.value).subscribe({
        next: (success) => {
          this.processing = false;
          if (success) {
            this.paymentSuccess = true;
            
            // Set the subscription in the service, which enables bulk access
            this.subscriptionService.setSubscription(planId);
            this.currentSubscription = planId;
            
            setTimeout(() => {
              this.closeModal();
              // Navigate directly to the bulk tab now that they have access
              this.router.navigate(['/dashboard/bulk']);
            }, 2000);
          }
        },
        error: (error) => {
          this.processing = false;
          this.paymentError = 'Payment processing failed. Please try again.';
          console.error('Payment error:', error);
        }
      });
    }
  }

  // Add a new method to handle plan cancellation
  cancelSubscription(): void {
    if (this.currentSubscription === 'free') {
      return; // Nothing to cancel
    }
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to cancel your Pro subscription? You will lose access to premium features.')) {
      this.subscriptionService.setSubscription('free');
      this.currentSubscription = 'free';
      alert('Your subscription has been cancelled. Changes will take effect immediately.');
      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/dashboard']);
      }, 1000);
    }
  }

  // Add a method to check if the current plan is the free plan
  isFreePlan(): boolean {
    return this.currentSubscription === 'free';
  }

  // Update the isCurrentPlan method to include this logic
  isCurrentPlan(planId: string): boolean {
    return this.currentSubscription === planId;
  }

  hasInvalidClass(controlName: string): boolean {
    const control = this.paymentForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}