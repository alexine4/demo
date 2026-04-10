import { Component } from '@angular/core';
import {
  NavigationService,
  SectionType,
} from '@app/core/services/navigation.service';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  constructor(private navigationService: NavigationService) {}

  public scrollToSection(section: string) {
    console.log('scrollToSection called with:', section);
    const sectionType = section as SectionType;
    this.navigationService.navigateToSection(sectionType);
  }
}
