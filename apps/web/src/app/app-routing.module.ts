import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { JobComponent } from './pages/job/job.component';
import { VehicleComponent } from './pages/vehicle/vehicle.component';
import { DeclutterComponent } from './pages/declutter/declutter.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'job', component: JobComponent },
  { path: 'vehicle', component: VehicleComponent },
  { path: 'declutter', component: DeclutterComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
