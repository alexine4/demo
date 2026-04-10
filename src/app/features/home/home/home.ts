import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  private http = inject(HttpClient);
  private el = inject(ElementRef);
  isTranslating = false;

  constructor(private navigationService: NavigationService) {}

  ngOnInit(): void {
    this.intersectionObserver =
      this.navigationService.setupIntersectionObserver();
  }

  public translate(): void {
    const contentEl: HTMLElement =
      this.el.nativeElement.querySelector('.userContent');
    if (!contentEl) return;

    // Clone and remove images to send only text HTML
    const clone = contentEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('img').forEach((img) => img.remove());

    const html = clone.innerHTML;
    const language =
      this.languages.find((l) => l.code === this.selectedLanguage)?.name ??
      this.selectedLanguage;

    const formData = new FormData();
    formData.append('html', html);
    formData.append('language', language);

    this.isTranslating = true;

    this.http
      .post<{
        output: string;
      }>('https://n8n.integrio.dev/webhook/71ebe155-67b7-4308-8e80-fa78a1fdd8b8', formData)
      .subscribe({
        next: (res) => {
          contentEl.innerHTML = res.output;
          this.isTranslating = false;
        },
        error: () => {
          this.isTranslating = false;
        },
      });
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
