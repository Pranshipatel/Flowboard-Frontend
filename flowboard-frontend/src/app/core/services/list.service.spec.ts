import { TestBed } from '@angular/core/testing';

import { ListService } from './list.service';

describe('ListService', () => {

  let service: ListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListService);
  });

  // Basic test to verify service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});