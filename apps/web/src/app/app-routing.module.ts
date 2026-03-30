import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { JobComponent } from './pages/job/job.component';
import { VehicleComponent } from './pages/vehicle/vehicle.component';
import { DeclutterComponent } from './pages/declutter/declutter.component';
import { GoalsPageComponent } from './features/goals/goals-page/goals-page.component';
import { GoalDetailPageComponent } from './features/goals/goal-detail-page/goal-detail-page.component';
import { WeeklyReviewPageComponent } from './features/weekly/weekly-review-page/weekly-review-page.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'job', component: JobComponent },
  { path: 'vehicle', component: VehicleComponent },
  { path: 'declutter', component: DeclutterComponent },
  { path: 'goals', component: GoalsPageComponent },
  { path: 'goals/:id', component: GoalDetailPageComponent },
  { path: 'weekly', component: WeeklyReviewPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
