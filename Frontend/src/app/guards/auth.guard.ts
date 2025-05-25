import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PredictionService } from '../views/dashboard/prediction.service';

export const authGuard: CanActivateFn = (route, state) => {
  const predictionService = inject(PredictionService);
  const router = inject(Router);

  if (predictionService.isLoggedIn()) {
    return true;
  } else {
    const returnUrl = state.url;
    router.navigate(['/login'], { 
      queryParams: { returnUrl }
    });
    return false;
  }
};