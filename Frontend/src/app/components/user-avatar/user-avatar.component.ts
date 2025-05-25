import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `<div [innerHTML]="svgContent" class="user-avatar"></div>`,
  styles: [`
    .user-avatar {
      display: inline-block;
      line-height: 0;
    }
    :host {
      display: inline-block;
    }
  `]
})
export class UserAvatarComponent implements OnChanges {
  @Input() username: string = '';
  @Input() size: number = 40;
  @Input() rounded: boolean = true;
  
  svgContent: SafeHtml = '';
  
  // Material design-inspired color palette
  private colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', 
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFC107', '#FF9800', '#FF5722'
  ];
  
  constructor(private sanitizer: DomSanitizer) {}
  
  ngOnChanges(): void {
    if (this.username) {
      this.generateAvatar();
    }
  }
  
  private generateAvatar(): void {
    // Get first letter or use a default
    const firstLetter = this.username ? this.username.charAt(0).toUpperCase() : '?';
    
    // Generate a deterministic color based on username
    const colorIndex = this.getHashCode(this.username) % this.colors.length;
    const bgColor = this.colors[colorIndex];
    
    // Generate a pattern ID unique to this username
    const patternId = `pattern-${this.getHashCode(this.username)}`;
    
    // Create SVG content with pattern background for visual interest
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${this.size}" height="${this.size}" viewBox="0 0 100 100">
        <defs>
          <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(255,255,255,0.1)" />
          </pattern>
        </defs>
        <circle cx="50" cy="50" r="50" fill="${bgColor}" />
        <circle cx="50" cy="50" r="50" fill="url(#${patternId})" />
        <text x="50" y="67" font-family="Arial, sans-serif" font-size="50" 
              font-weight="bold" text-anchor="middle" fill="white">${firstLetter}</text>
      </svg>
    `;
    
    // Sanitize the SVG to safely use it in the template
    this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svg);
  }
  
  // Generate a deterministic hash code from the username string
  private getHashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}