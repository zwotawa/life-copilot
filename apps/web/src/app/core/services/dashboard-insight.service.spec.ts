import { TestBed } from '@angular/core/testing';

import { DashboardInsightService } from './dashboard-insight.service';

describe('DashboardInsightService', () => {
  let service: DashboardInsightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardInsightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
