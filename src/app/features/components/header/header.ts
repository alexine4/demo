import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
} from '@angular/core';
import {
  NavigationService,
  SectionType,
} from 'src/app/core/services/navigation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  activeSection: SectionType = 'home';
  isMobileMenuOpen = false;
  private subscription = new Subscription();

  constructor(
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscribeToActiveSection();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  setActiveSection(section: SectionType) {
    this.navigationService.navigateToSection(section);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const header = target.closest('.header');

    // Закрити меню, якщо клік поза header
    if (!header && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  private subscribeToActiveSection() {
    this.subscription.add(
      this.navigationService.activeSection$.subscribe((section) => {
        this.activeSection = section;
        this.cdr.detectChanges();
      })
    );
  }
}
