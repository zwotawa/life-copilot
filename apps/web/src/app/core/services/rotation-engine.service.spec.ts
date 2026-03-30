import { TestBed } from '@angular/core/testing';

import { RotationEngineService } from './rotation-engine.service';

describe('RotationEngineService', () => {
  let service: RotationEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RotationEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
