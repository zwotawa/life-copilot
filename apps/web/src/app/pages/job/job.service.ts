import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateJobCardRequest, JobCard, UpdateJobCardRequest } from 'src/app/core/job-pipeline.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(private http: HttpClient) { }

  public getJobs(): Observable<JobCard[]> {
    return this.http.get<JobCard[]>('/api/jobs');
  }

  public addJob(req: CreateJobCardRequest): Observable<JobCard> {
    return this.http.post<JobCard>('/api/jobs-proxy', req);
  }

  public updateJob(id: string, req: UpdateJobCardRequest): Observable<JobCard> {
    return this.http.put<JobCard>(`/api/jobs-proxy/${id}`, req);
  }

  public deleteJob(id: string): Observable<void> {
    return this.http.delete<void>(`/api/jobs-proxy/${id}`);
  }
}
