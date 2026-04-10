import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { Header } from '@features/components/header/header';
import { Footer } from '@features/components/footer/footer';

@Component({
  selector: 'app-layout',
  imports: [CdkScrollableModule, Header, Footer, RouterModule],
  template: `
    <div class="app-layout">
      <div class="wrapper">
        <app-header></app-header>
        <main class="content" cdkScrollable>
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      </div>
    </div>
  `,
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {}
