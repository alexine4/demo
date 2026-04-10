import { Routes } from '@angular/router';
import { LayoutComponent } from './features/components/layout/layout.component';
import { Home } from './features/home/home/home';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: Home, pathMatch: 'full' },
      { path: 'home', component: Home },
    ],
  },
  { path: '**', redirectTo: '' },
];
