import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GoalsPageComponent } from './features/goals/goals-page/goals-page.component';
import { GoalDetailPageComponent } from './features/goals/goal-detail-page/goal-detail-page.component';
import { WeeklyReviewPageComponent } from './features/weekly/weekly-review-page/weekly-review-page.component';
import { DailyRotationPageComponent } from './features/daily/daily-rotation-page/daily-rotation-page.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page/dashboard-page.component';
import { InboxPageComponent } from './features/inbox/inbox-page/inbox-page.component';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { RegisterComponent } from './features/register/register.component';
import { PendingChangesGuard } from './core/guards/pending-changes.guard';

const routes: Routes = [{
  path:'',
  canActivate: [AuthGuard],
  children: [
    { path: '', component: DashboardPageComponent },
    { path: 'goals', component: GoalsPageComponent, canDeactivate: [PendingChangesGuard] },
    { path: 'goals/:id', component: GoalDetailPageComponent, canDeactivate: [PendingChangesGuard] },
    { path: 'weekly', component: WeeklyReviewPageComponent, canDeactivate: [PendingChangesGuard] },
    { path: 'daily', component: DailyRotationPageComponent },
    { path: 'inbox', component: InboxPageComponent }
    
  ]
},
{ path: 'login', component: LoginComponent},
{ path: 'register', component: RegisterComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
