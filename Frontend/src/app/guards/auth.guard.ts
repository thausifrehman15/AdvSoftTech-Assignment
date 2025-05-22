import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PredictionService } from '../views/dashboard/prediction.service';

export const authGuard: CanActivateFn = (route, state) => {
  const predictionService = inject(PredictionService);
  const router = inject(Router);

  if (predictionService.isLoggedIn()) {
    // User is logged in, allow access
    return true;
  } else {
    // User is not logged in, redirect to login page
    // Store the attempted URL for redirecting later
    const returnUrl = state.url;
    
    // Navigate to login page with return URL
    router.navigate(['/login'], { 
      queryParams: { returnUrl }
    });
    
    return false;
  }
};