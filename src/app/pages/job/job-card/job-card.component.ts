import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { JobCard } from 'src/app/core/job-pipeline.model';

export interface CardMovement {
  card: JobCard,
  moveDirection: MoveDirection
}

export type MoveDirection = 'back' | 'forward';

@Component({
  selector: 'app-job-card',
  templateUrl: './job-card.component.html',
  styleUrls: ['./job-card.component.scss']
})
export class JobCardComponent implements OnInit {

  @Input() jobCardData: JobCard = <JobCard>{}

  @Output() moveEvent = new EventEmitter<CardMovement>();

  public back: MoveDirection = 'back';
  public forward: MoveDirection = 'forward';

  constructor() { }

  ngOnInit(): void {
  }

  public moveCard(card: JobCard, moveDirection: MoveDirection): void {
    this.moveEvent.emit({ card, moveDirection }); 
  }

}
