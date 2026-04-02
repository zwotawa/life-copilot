import { TestBed } from '@angular/core/testing';

import { StorageKeyService } from './storage-key.service';

describe('StorageKeyService', () => {
  let service: StorageKeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageKeyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
