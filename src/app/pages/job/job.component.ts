import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-job',
  templateUrl: './job.component.html',
  styleUrls: ['./job.component.scss']
})
export class JobComponent implements OnInit {

  public stages: string[] = ['toApply', 'applied', 'follouUp', 'interview'];
  public cardsInStage: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

}
