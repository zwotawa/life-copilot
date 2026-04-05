import { TestBed } from '@angular/core/testing';

import { WeeklyInsightsService } from './weekly-insights.service';

describe('WeeklyInsightsService', () => {
  let service: WeeklyInsightsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeeklyInsightsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
