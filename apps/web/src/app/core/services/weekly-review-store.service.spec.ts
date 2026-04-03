import { TestBed } from '@angular/core/testing';

import { WeeklyReviewStoreService } from './weekly-review-store.service';

describe('WeeklyReviewStoreService', () => {
  let service: WeeklyReviewStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WeeklyReviewStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
