import { TestBed } from '@angular/core/testing';

import { LocalWeeklyReviewService } from './local-weekly-review.service';

describe('WeeklyReviewService', () => {
  let service: LocalWeeklyReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalWeeklyReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
