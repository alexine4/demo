import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NavigationService } from '../../../core/services/navigation.service';

export interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule, MatSelectModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private intersectionObserver?: IntersectionObserver | null;

  selectedLanguage = 'uk';

  languages: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'pl', name: 'Polski' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
    { code: 'uk', name: 'Українська' },
  ];

  constructor(private navigationService: NavigationService) {}

  ngOnInit(): void {
    this.intersectionObserver =
      this.navigationService.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
