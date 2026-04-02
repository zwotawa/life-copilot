import { TestBed } from '@angular/core/testing';

import { DailyRotationStoreService } from './daily-rotation-store.service';

describe('DailyRotationStoreService', () => {
  let service: DailyRotationStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyRotationStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
