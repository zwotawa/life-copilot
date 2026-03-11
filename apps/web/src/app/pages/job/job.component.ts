import { Component, OnInit, OnDestroy } from '@angular/core';
import { JobCard, JobStage } from 'src/app/core/job-pipeline.model';
import { loadJobCards, saveJobCards, updateJobCard } from 'src/app/core/job-pipeline.storage';
import { CardMovement } from './job-card/job-card.component';
import { JobService } from './job.service';
import { Observable, Subscription } from 'rxjs';

interface Stage {
  stageName: JobStage,
  stageCards: JobCard[]
}

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit {

  public stages: Stage[] = [{
    stageName:'toApply',
    stageCards: []
   },
   {
    stageName: 'applied',
    stageCards: [] 
    },
    {
      stageName: 'followUp',
      stageCards: []
    },
    {
      stageName: 'interview',
      stageCards: []
    }];
  public jobCards: JobCard[] = <JobCard[]>[];
  public isLoading: boolean = false;
  public error: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private jobService: JobService) { }

  ngOnInit(): void {
    this.refresh();
  }

  public moveCard(cardMovement: CardMovement): void {
    const currentStage: number = this.stages.findIndex((stage) => cardMovement.card.stage == stage.stageName);
    let newStage: number = -1;
    if(cardMovement.moveDirection == 'back') {
      newStage = currentStage - 1;
    }
    if(cardMovement.moveDirection == 'forward') {
      newStage = currentStage + 1;
    }

    const updatedCard: JobCard = JSON.parse(JSON.stringify(cardMovement.card));
    updatedCard.stage = this.stages[newStage].stageName;
    updatedCard.lastTouchedAt = Date.now();

    this.subscriptions.push(this.jobService.updateJob(updatedCard).subscribe({
      next: () => { this.refresh() },
      error: (err) => { console.error(err) }
    }));

    updateJobCard(updatedCard);
  }

  private refresh(): void {
    this.isLoading = true;
    this.error = null;

    this.subscriptions?.push(this.jobService.getJobs().subscribe({
      next: (cards) => {
        this.jobCards = cards;
        this.isLoading = false;
        this.populateStageCards();
      },
      error: (err) => {
        this.error = 'Failed to load jobs';
        this.isLoading = false;
        console.error(err);
      }
    }));
  }

  private stageCards(stage: JobStage): JobCard[] {
    return this.jobCards.filter(card => card.stage == stage).sort((a, b) => {
      const dateA = new Date(a.lastTouchedAt).getTime();
      const dateB = new Date(b.lastTouchedAt).getTime();

      return dateB - dateA;
    });
  }

  private populateStageCards(): void {
    this.stages.forEach(stage => {
      stage.stageCards = this.stageCards(stage.stageName);
    });
  }

  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }

}

export const MOCK_JOB_CARDS: JobCard[] = [
  {
    id: "job-001",
    company: "Northstar Logistics",
    role: "Frontend Engineer (Angular)",
    link: "https://example.com/jobs/northstar-angular-fe",
    stage: "toApply",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    nextAction: "Tailor resume: emphasize Angular forms + RxJS"
  },
  {
    id: "job-002",
    company: "Clearwater Health",
    role: "Software Engineer, UI (Angular)",
    link: "https://example.com/jobs/clearwater-ui",
    stage: "toApply",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    nextAction: "Write 3-sentence cover note + submit"
  },
  {
    id: "job-003",
    company: "Midwest FinTech Co",
    role: "Frontend Engineer (TypeScript/Angular)",
    link: "https://example.com/jobs/mwfintech-fe",
    stage: "applied",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    nextAction: "Follow up with recruiter (short ping)"
  },
  {
    id: "job-004",
    company: "River City Insurance",
    role: "Full-Stack Engineer (Angular + .NET)",
    link: "https://example.com/jobs/rivercity-fullstack",
    stage: "applied",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    nextAction: "Add follow-up action for Friday"
  },
  {
    id: "job-005",
    company: "Prairie Analytics",
    role: "Frontend Engineer (Dashboards)",
    link: "https://example.com/jobs/prairie-dashboards",
    stage: "followUp",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    nextAction: "Send follow-up + attach portfolio link"
  },
  {
    id: "job-006",
    company: "Orbit Commerce",
    role: "Senior Frontend Engineer (Angular)",
    link: "https://example.com/jobs/orbit-sr-fe",
    stage: "followUp",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    nextAction: "Ask about timeline + offer quick call"
  },
  {
    id: "job-007",
    company: "Cedar Systems",
    role: "Software Engineer (Frontend)",
    link: "https://example.com/jobs/cedar-frontend",
    stage: "interview",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 12,
    nextAction: "Prep: RxJS operators + change detection + testing"
  },
  {
    id: "job-008",
    company: "Lakeside Education",
    role: "Angular Engineer",
    link: "https://example.com/jobs/lakeside-angular",
    stage: "interview",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
    lastTouchedAt: Date.now() - 1000 * 60 * 60 * 36,
    nextAction: "Prepare STAR stories (impact, conflict, ambiguity)"
  }
];
