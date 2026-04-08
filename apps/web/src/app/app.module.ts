import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JobComponent } from './pages/job/job.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
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
import { AuthService } from './core/auth/auth.service';
import { MockAuthService } from './core/auth/mock-auth.service';
import { LoginComponent } from './features/login/login.component';
import { GoalRepository } from './core/repositories/goal.repository';
import { LocalGoalRepository } from './core/services/local/local-goal.service';
import { InboxRepository } from './core/repositories/inbox.repository';
import { LocalInboxService } from './core/services/local/local-inbox.service';
import { LocalDailyRotationRepository } from './core/services/local/local-daily-rotation.service';
import { DailyRotationRepository } from './core/repositories/daily-rotation.repository';
import { WeeklyReviewRepository } from './core/repositories/weekly-review.repository';
import { LocalWeeklyReviewService } from './core/services/local-weekly-review.service';
import { DailyCompletionHistoryRepository } from './core/repositories/daily-completion-history.repository';
import { LocalDailyCompletionHistoryService } from './core/services/local/local-daily-completion-history.service';
import { ApiAuthService } from './core/auth/api-auth.service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthTokenInterceptor } from './core/auth/auth-token-interceptor.service';
import { ApiGoalRepository } from './core/services/api-goal-repository.service';
import { GoalProgressRepository } from './core/repositories/goal-progress.repository';
import { LocalGoalProgressRepository } from './core/services/local/local-goal-progress-repository.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return async () => {
    await authService.restoreSession();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    JobComponent,
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
    InboxPageComponent,
    LoginComponent
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
  providers: [
    {provide: AuthService, useClass: ApiAuthService},
    {provide: GoalRepository, useClass: ApiGoalRepository},
    {provide: InboxRepository, useClass: LocalInboxService},
    {provide: DailyRotationRepository, useClass: LocalDailyRotationRepository},
    {provide: WeeklyReviewRepository, useClass: LocalWeeklyReviewService},
    {provide: DailyCompletionHistoryRepository, useClass: LocalDailyCompletionHistoryService},
    {provide: GoalProgressRepository, useClass: LocalGoalProgressRepository},
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthTokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
