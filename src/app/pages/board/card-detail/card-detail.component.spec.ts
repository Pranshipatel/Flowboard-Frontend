import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';

import { CardDetailComponent } from './card-detail.component';
import { CardService } from '../../../core/services/card.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('CardDetailComponent', () => {
  let component: CardDetailComponent;
  let fixture: ComponentFixture<CardDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardDetailComponent],
      providers: [
        { provide: Store, useValue: { dispatch: jasmine.createSpy('dispatch') } },
        { provide: CardService, useValue: { getActivity: jasmine.createSpy('getActivity').and.returnValue(of([])) } },
        { provide: AuthService, useValue: { getUserId: jasmine.createSpy('getUserId').and.returnValue(1) } },
        { provide: NotificationService, useValue: { sendNotification: jasmine.createSpy('sendNotification').and.returnValue(of({})) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardDetailComponent);
    component = fixture.componentInstance;
    component.card = {
      id: 1,
      listId: 1,
      boardId: 1,
      title: 'Test card',
      description: null,
      position: 0,
      priority: 'MEDIUM',
      status: 'TO_DO',
      isOverdue: false,
      coverColor: null
    } as any;
    component.isGuest = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
