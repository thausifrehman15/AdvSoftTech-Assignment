import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'single',
    pathMatch: 'full'
  },
  {
    path: 'single',
    component: DashboardComponent,
    data: {
      activeTab: 'single'
    }
  },
  {
    path: 'bulk',
    component: DashboardComponent,
    data: {
      activeTab: 'bulk'
    }
  }
];