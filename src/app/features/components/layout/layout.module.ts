import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { Home } from '@app/features/home/home/home';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        component: Home,
      },
    ],
  },
];

@NgModule({
  imports: [CommonModule, LayoutComponent, RouterModule.forChild(routes)],
  providers: [],
})
export class LayoutModule {}
