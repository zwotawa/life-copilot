import { TestBed } from '@angular/core/testing';

import { WeeklyReviewService } from './weekly-review.service';

describe('WeeklyReviewService', () => {
  let service: WeeklyReviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeeklyReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
