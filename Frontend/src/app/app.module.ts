import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IconModule, IconSetModule, IconSetService } from '@coreui/icons-angular';
// Import the specific icons or use the complete sets
import { freeSet } from '@coreui/icons'; // For all free icons

@NgModule({
  imports: [
    BrowserModule,
    IconModule,
    IconSetModule.forRoot(),
    // Other modules
  ],
  providers: [
    IconSetService,
    // Other providers
  ]
})
export class AppModule { 
  constructor(private iconSetService: IconSetService) {
    // Register all icons from the free set
    this.iconSetService.icons = { ...freeSet };
  }
}