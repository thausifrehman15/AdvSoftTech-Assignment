import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { IconModule, IconSetModule, IconSetService } from '@coreui/icons-angular';
// Import the specific icons or use the complete sets
import { freeSet } from '@coreui/icons'; // For all free icons

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
    constructor(private iconSetService: IconSetService) {
    // Register all icons from the free set
    this.iconSetService.icons = { ...freeSet };
  }
}