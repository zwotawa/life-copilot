import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JobComponent } from './pages/job/job.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { ListItemComponent } from './shared/list-item/list-item.component';
import { TimerDialogComponent } from './shared/timer-dialog/timer-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { SecondsToMinutesPipe } from './shared/pipes/seconds-to-minutes.pipe';
import { FormsModule } from '@angular/forms';
import { CapitalilzeFirstLetter } from './shared/pipes/capitalize-first-letter.pipe';
import { JobCardComponent } from './pages/job/job-card/job-card.component';
import { MatIconModule } from '@angular/material/icon'
import { JobService } from './pages/job/job.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { GoalsPageComponent } from './features/goals/goals-page/goals-page.component';
import { GoalCardComponent } from './shared/components/goal-card/goal-card.component';
import { GoalDetailPageComponent } from './features/goals/goal-detail-page/goal-detail-page.component';
import { GoalFormComponent } from './features/goals/goal-form/goal-form.component';
import { WeeklyReviewPageComponent } from './features/weekly/weekly-review-page/weekly-review-page.component';
import { DailyRotationPageComponent } from './features/daily/daily-rotation-page/daily-rotation-page.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { InboxPageComponent } from './features/inbox/inbox-page/inbox-page.component';

@NgModule({
  declarations: [
    AppComponent,
    JobComponent,
    ListItemComponent,
    TimerDialogComponent,
    SecondsToMinutesPipe,
    CapitalilzeFirstLetter,
    JobCardComponent,
    ConfirmDialogComponent,
    GoalsPageComponent,
    GoalCardComponent,
    GoalDetailPageComponent,
    GoalFormComponent,
    WeeklyReviewPageComponent,
    DailyRotationPageComponent,
    DashboardPageComponent,
    InboxPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatDialogModule,
    MatRadioModule,
    FormsModule,
    MatIconModule,
    HttpClientModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  providers: [JobService],
  bootstrap: [AppComponent]
})
export class AppModule { }
