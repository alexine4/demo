import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type SectionType =
  | 'home'
  | 'features'
  | 'pricing'
  | 'how-it-works'
  | 'contact-us';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private activeSectionSubject = new BehaviorSubject<SectionType>('home');
  public activeSection$ = this.activeSectionSubject.asObservable();
  private isTranslatingSubject = new BehaviorSubject<boolean>(false);
  public isTranslating$ = this.isTranslatingSubject.asObservable();
  private isNavigating = false;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  setActiveSection(section: SectionType): void {
    this.activeSectionSubject.next(section);
  }

  getCurrentSection(): SectionType {
    return this.activeSectionSubject.value;
  }

  setTranslating(value: boolean): void {
    this.isTranslatingSubject.next(value);
  }

  navigateToSection(section: SectionType): void {
    const sectionId = this.getSectionId(section);
    this.isNavigating = true;

    this.setActiveSection(section);

    // Only run on browser
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const element = this.document.getElementById(sectionId);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });

          setTimeout(() => {
            this.isNavigating = false;
          }, 1000);
        } else {
          console.warn(`Element with ID '${sectionId}' not found`);
          this.isNavigating = false;
        }
      }, 100);
    } else {
      this.isNavigating = false;
    }
  }

  private getSectionId(section: SectionType): string {
    return section === 'how-it-works'
      ? 'how-it-works-section'
      : `${section}-section`;
  }

  setupIntersectionObserver(): IntersectionObserver | null {
    // Return null on server side
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const options = {
      root: null,
      rootMargin: '-20% 0px -80% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      if (this.isNavigating) {
        return;
      }

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          const section = this.getSectionTypeFromId(sectionId);

          if (section) {
            this.setActiveSection(section);
          }
        }
      });
    }, options);

    setTimeout(() => {
      this.observeSections(observer);
    }, 100);

    return observer;
  }

  private observeSections(observer: IntersectionObserver): void {
    const sections = [
      'home-section',
      'features-section',
      'pricing-section',
      'how-it-works-section',
    ];

    sections.forEach((sectionId) => {
      const element = this.document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });
  }

  private getSectionTypeFromId(sectionId: string): SectionType | null {
    switch (sectionId) {
      case 'home-section':
        return 'home';
      case 'features-section':
        return 'features';
      case 'pricing-section':
        return 'pricing';
      case 'how-it-works-section':
        return 'how-it-works';
      default:
        return null;
    }
  }
}
