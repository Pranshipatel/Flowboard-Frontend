import { TestBed } from '@angular/core/testing';

import { CardService } from './card.service';

describe('CardService', () => {

  let service: CardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardService);
  });

  // Basic test to verify service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

});