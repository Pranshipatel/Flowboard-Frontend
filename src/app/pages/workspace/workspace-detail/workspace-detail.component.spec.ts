import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { WorkspaceDetailComponent } from './workspace-detail.component';
import { AuthService } from '../../../core/services/auth.service';
import { BoardService } from '../../../core/services/board.service';
import { PaymentService } from '../../../core/services/payment.service';
import { WorkspaceService } from '../../../core/services/workspace.service';

describe('WorkspaceDetailComponent', () => {
  let component: WorkspaceDetailComponent;
  let fixture: ComponentFixture<WorkspaceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspaceDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getUserId: jasmine.createSpy('getUserId').and.returnValue(1),
            searchUsers: jasmine.createSpy('searchUsers').and.returnValue(of([]))
          }
        },
        {
          provide: WorkspaceService,
          useValue: {
            getById: jasmine.createSpy('getById').and.returnValue(of({ id: 1, name: 'Workspace', description: null, ownerId: 1, visibility: 'PUBLIC', logoUrl: null, createdAt: '', updatedAt: null, members: [] })),
            getMembers: jasmine.createSpy('getMembers').and.returnValue(of([])),
            isWorkspacePinned: jasmine.createSpy('isWorkspacePinned').and.returnValue(false),
            isWorkspaceArchived: jasmine.createSpy('isWorkspaceArchived').and.returnValue(false)
          }
        },
        { provide: BoardService, useValue: { getByWorkspace: jasmine.createSpy('getByWorkspace').and.returnValue(of([])) } },
        {
          provide: PaymentService,
          useValue: {
            subscriptionStatus: new BehaviorSubject<string>('FREE'),
            isPaidPlan: jasmine.createSpy('isPaidPlan').and.returnValue(false),
            canCreateBoard: jasmine.createSpy('canCreateBoard').and.returnValue(true)
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
