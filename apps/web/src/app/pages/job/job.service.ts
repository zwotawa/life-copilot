import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JobCard, UpdateJobCardRequest } from 'src/app/core/job-pipeline.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(private http: HttpClient) { }

  public getJobs(): Observable<JobCard[]> {
    return this.http.get<JobCard[]>('/api/jobs');
  }

  public addJob(job: JobCard): Observable<JobCard> {
    return this.http.post<JobCard>('/api-proxy/jobs', job);
  }

  public updateJob(id: string, req: UpdateJobCardRequest): Observable<JobCard> {
    return this.http.put<JobCard>(`/api-proxy/jobs/${id}`, req);
  }

  public deleteJob(job: JobCard): Observable<void> {
    return this.http.delete<void>(`/api-proxy/jobs/${job.id}`);
  }
}
