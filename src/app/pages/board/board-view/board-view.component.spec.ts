import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';

import { BoardViewComponent } from './board-view.component';
import { AuthService } from '../../../core/services/auth.service';
import { BoardService } from '../../../core/services/board.service';
import { CardService } from '../../../core/services/card.service';
import { ListService } from '../../../core/services/list.service';
import { PaymentService } from '../../../core/services/payment.service';

describe('BoardViewComponent', () => {
  let component: BoardViewComponent;
  let fixture: ComponentFixture<BoardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardViewComponent],
      providers: [
        provideRouter([]),
        { provide: Store, useValue: { dispatch: jasmine.createSpy('dispatch'), select: jasmine.createSpy('select').and.returnValue(of([])) } },
        { provide: Actions, useValue: of() },
        { provide: AuthService, useValue: { isLoggedIn: jasmine.createSpy('isLoggedIn').and.returnValue(true), getUserById: jasmine.createSpy('getUserById').and.returnValue(of({})) } },
        { provide: BoardService, useValue: { getPublicBoardDetails: jasmine.createSpy('getPublicBoardDetails').and.returnValue(of(null)) } },
        { provide: ListService, useValue: {} },
        { provide: CardService, useValue: {} },
        { provide: PaymentService, useValue: { subscriptionStatus: new BehaviorSubject<string>('FREE'), checkPremiumUsage: jasmine.createSpy('checkPremiumUsage').and.returnValue(true) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardViewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
