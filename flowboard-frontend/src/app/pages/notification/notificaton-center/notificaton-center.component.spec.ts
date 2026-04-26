import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificatonCenterComponent } from './notificaton-center.component';

describe('NotificatonCenterComponent', () => {
  let component: NotificatonCenterComponent;
  let fixture: ComponentFixture<NotificatonCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificatonCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificatonCenterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
