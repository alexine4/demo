import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { NavigationService } from '../../../core/services/navigation.service';
import mockData from './mock-data.json';

export interface Language {
  code: string;
  name: string;
}

@Component({
  selector: 'app-home',
  imports: [FormsModule, MatProgressBarModule, MatSelectModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy, AfterViewInit {
  private intersectionObserver?: IntersectionObserver | null;

  @ViewChild('imageUpload') imageUploadInput!: ElementRef<HTMLInputElement>;
  private clickedImage: HTMLImageElement | null = null;

  selectedLanguage = 'en';

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
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  isTranslating = false;
  private originalEnHtml: string | null = null;

  constructor(private navigationService: NavigationService) {}

  ngOnInit(): void {
    this.intersectionObserver =
      this.navigationService.setupIntersectionObserver();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupImageClickHandlers();
      this.applyImageOverrides();
    }
  }

  onLanguageChange(): void {
    this.applyImageOverrides();
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.clickedImage) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (!this.clickedImage) return;

      const originalSrc =
        this.clickedImage.dataset['originalSrc'] || this.clickedImage.src;

      if (file.size <= MAX_SIZE) {
        this.clickedImage.src = base64;
        this.clickedImage.srcset = '';
        this.saveImageOverride(originalSrc, base64);
        input.value = '';
        return;
      }

      this.compressImage(base64, MAX_SIZE).then((compressed) => {
        if (this.clickedImage) {
          this.clickedImage.src = compressed;
          this.clickedImage.srcset = '';
          this.saveImageOverride(originalSrc, compressed);
        }
        input.value = '';
      });
    };
    reader.readAsDataURL(file);
  }

  private compressImage(base64: string, maxBytes: number): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if very large
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);

        while (result.length * 0.75 > maxBytes && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(result);
      };
      img.src = base64;
    });
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('d2l_images', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('overrides')) {
          db.createObjectStore('overrides');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private setupImageClickHandlers(): void {
    const contentEl: HTMLElement =
      this.el.nativeElement.querySelector('.userContent');
    if (!contentEl) return;

    contentEl.querySelectorAll('img').forEach((img) => {
      if (!img.dataset['originalSrc']) {
        img.dataset['originalSrc'] = img.src;
      }
      img.style.cursor = 'pointer';
      img.title =
        'Click to upload a replacement image for the selected language';
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clickedImage = img;
        this.imageUploadInput.nativeElement.click();
      });
    });
  }

  private async applyImageOverrides(): Promise<void> {
    const contentEl: HTMLElement =
      this.el.nativeElement.querySelector('.userContent');
    if (!contentEl) return;

    const langOverrides = await this.getImageOverridesForLang(
      this.selectedLanguage,
    );

    contentEl.querySelectorAll('img').forEach((img) => {
      const originalSrc = img.dataset['originalSrc'] || img.src;
      if (!img.dataset['originalSrc']) {
        img.dataset['originalSrc'] = originalSrc;
      }
      if (langOverrides[originalSrc]) {
        img.src = langOverrides[originalSrc];
        img.srcset = '';
      } else {
        img.src = originalSrc;
        img.srcset = '';
      }
    });
  }

  private async saveImageOverride(
    originalSrc: string,
    base64: string,
  ): Promise<void> {
    try {
      const db = await this.openDb();
      const key = `${this.selectedLanguage}::${originalSrc}`;
      const tx = db.transaction('overrides', 'readwrite');
      tx.objectStore('overrides').put(base64, key);
    } catch (e) {
      console.warn('Failed to save image override', e);
    }
  }

  private async getImageOverridesForLang(
    lang: string,
  ): Promise<Record<string, string>> {
    try {
      const db = await this.openDb();
      const tx = db.transaction('overrides', 'readonly');
      const store = tx.objectStore('overrides');
      return new Promise((resolve) => {
        const result: Record<string, string> = {};
        const req = store.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith(`${lang}::`)) {
              result[key.substring(lang.length + 2)] = cursor.value;
            }
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        req.onerror = () => resolve({});
      });
    } catch {
      return {};
    }
  }

  public translate(): void {
    const contentEl: HTMLElement =
      this.el.nativeElement.querySelector('.userContent');
    if (!contentEl) return;

    // Save and detach control-panel so it survives translation
    const controlPanel = contentEl.querySelector('.control-panel');
    const controlPanelParent = controlPanel?.parentElement;
    controlPanel?.remove();

    // Cache the original English HTML on the first translation
    if (!this.originalEnHtml) {
      this.originalEnHtml = contentEl.innerHTML;
    }

    // Restore cached English version without making a request
    if (this.selectedLanguage === 'en' && this.originalEnHtml) {
      contentEl.innerHTML = this.originalEnHtml;
      if (controlPanel) {
        contentEl
          .querySelector('#general-announcements')
          ?.appendChild(controlPanel);
      }
      setTimeout(() => {
        this.setupImageClickHandlers();
        this.applyImageOverrides();
      });
      return;
    }

    // Save images with placeholders so they survive translation
    const images: Map<string, string> = new Map();
    const clone = contentEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('img').forEach((img, i) => {
      const placeholder = `<!--IMG_PLACEHOLDER_${i}-->`;
      images.set(placeholder, img.outerHTML);
      img.replaceWith(document.createComment(`IMG_PLACEHOLDER_${i}`));
    });

    const html = clone.innerHTML;
    const language =
      this.languages.find((l) => l.code === this.selectedLanguage)?.name ??
      this.selectedLanguage;

    const formData = new FormData();
    formData.append('html', html);
    formData.append('language', language);

    this.isTranslating = true;
    this.navigationService.setTranslating(true);

    this.http
      .post<{
        output: string;
      }>(
        'https://n8n.integrio.dev/webhook/71ebe155-67b7-4308-8e80-fa78a1fdd8b8',
        formData,
      )
      .subscribe({
        next: (res) => {
          let result = res.output;
          images.forEach((imgHtml, placeholder) => {
            result = result.replace(placeholder, imgHtml);
          });
          const temp = document.createElement('div');
          temp.innerHTML = result;
          temp.querySelector('.control-panel')?.remove();
          contentEl.innerHTML = temp.innerHTML;
          if (controlPanel) {
            contentEl
              .querySelector('#general-announcements')
              ?.appendChild(controlPanel);
          }
          this.isTranslating = false;
          this.navigationService.setTranslating(false);
          setTimeout(() => {
            this.setupImageClickHandlers();
            this.applyImageOverrides();
          });
        },
        error: () => {
          this.isTranslating = false;
          this.navigationService.setTranslating(false);
          if (controlPanel) {
            controlPanelParent?.appendChild(controlPanel);
          }
        },
      });
    /*     setTimeout(() => {
      let res = mockData.output;
      images.forEach((imgHtml, placeholder) => {
        res = res.replace(placeholder, imgHtml);
      });
      const temp = document.createElement('div');
      temp.innerHTML = res;
      temp.querySelector('.control-panel')?.remove();
      contentEl.innerHTML = temp.innerHTML;
      if (controlPanel) {
        contentEl
          .querySelector('#general-announcements')
          ?.appendChild(controlPanel);
      }
      this.isTranslating = false;
      this.navigationService.setTranslating(false);
      this.cdr.markForCheck();
      setTimeout(() => {
        this.setupImageClickHandlers();
        this.applyImageOverrides();
      });
    }, 1000); */
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}
