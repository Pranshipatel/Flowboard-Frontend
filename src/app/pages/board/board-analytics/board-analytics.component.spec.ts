import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardAnalyticsComponent } from './board-analytics.component';

describe('BoardAnalyticsComponent', () => {
  let component: BoardAnalyticsComponent;
  let fixture: ComponentFixture<BoardAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardAnalyticsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardAnalyticsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
