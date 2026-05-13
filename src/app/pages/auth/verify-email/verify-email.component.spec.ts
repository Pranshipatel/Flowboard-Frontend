import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../../core/services/auth.service';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;

  beforeEach(async () => {
    localStorage.setItem('pendingEmail', 'test@example.com');

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            verifyEmail: jasmine.createSpy('verifyEmail').and.returnValue(of('ok')),
            resendVerification: jasmine.createSpy('resendVerification').and.returnValue(of('ok'))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('pendingEmail');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
