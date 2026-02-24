import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { JobComponent } from './pages/job/job.component';
import { VehicleComponent } from './pages/vehicle/vehicle.component';
import { DeclutterComponent } from './pages/declutter/declutter.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { GoalCardComponent } from './shared/goal-card/goal-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { ListItemComponent } from './shared/list-item/list-item.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    JobComponent,
    VehicleComponent,
    DeclutterComponent,
    GoalCardComponent,
    ListItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
