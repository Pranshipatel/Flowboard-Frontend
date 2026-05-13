import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { WorkspaceService } from '../../../core/services/workspace.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getProfile: jasmine.createSpy('getProfile').and.returnValue(of({ id: 1, fullName: 'Test User', email: 'test@example.com', role: 'MEMBER' })),
            logout: jasmine.createSpy('logout')
          }
        },
        {
          provide: WorkspaceService,
          useValue: {
            archivedUpdated$: new Subject<void>(),
            getByMember: jasmine.createSpy('getByMember').and.returnValue(of([])),
            isWorkspaceArchived: jasmine.createSpy('isWorkspaceArchived').and.returnValue(false),
            isWorkspacePinned: jasmine.createSpy('isWorkspacePinned').and.returnValue(false),
            togglePinWorkspace: jasmine.createSpy('togglePinWorkspace'),
            toggleArchiveWorkspace: jasmine.createSpy('toggleArchiveWorkspace')
          }
        },
        {
          provide: PaymentService,
          useValue: {
            currentPlan: jasmine.createSpy('currentPlan').and.returnValue(null),
            isPaidPlan: jasmine.createSpy('isPaidPlan').and.returnValue(false),
            getSubscriptionStatus: jasmine.createSpy('getSubscriptionStatus').and.returnValue(of(null))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
