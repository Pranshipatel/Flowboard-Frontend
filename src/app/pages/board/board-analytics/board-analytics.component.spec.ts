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
    component.board = {
      id: 1,
      workspaceId: 1,
      name: 'Test board',
      description: null,
      background: null,
      visibility: 'PUBLIC',
      createdById: 1,
      isClosed: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
      memberCount: 0,
      members: [],
      analytics: {
        totalMembers: 0,
        observerCount: 0,
        memberCount: 0,
        adminCount: 0
      }
    };
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate status, due date, and overdue statistics', () => {
    component.allCards = [
      { status: 'TO_DO' },
      { status: 'IN_PROGRESS', dueDate: '2099-01-01' },
      { status: 'IN_REVIEW', isOverdue: true },
      { status: 'DONE', dueDate: '2000-01-01' }
    ] as any;

    component.calculateStats();

    expect(component.stats.total).toBe(4);
    expect(component.stats.todo).toBe(1);
    expect(component.stats.inProgress).toBe(1);
    expect(component.stats.inReview).toBe(1);
    expect(component.stats.done).toBe(1);
    expect(component.stats.overdue).toBe(1);
    expect(component.stats.withDueDates).toBe(2);
    expect(component.getPercentage(1)).toBe(25);
  });

  it('should return zero percentage when there are no cards', () => {
    component.allCards = [];
    component.calculateStats();

    expect(component.getPercentage(3)).toBe(0);
  });

  it('should detect overdue boards only when the due date has passed', () => {
    component.board = { ...component.board, dueDate: '2000-01-01' };
    expect(component.isBoardOverdue()).toBeTrue();

    component.board = { ...component.board, dueDate: '2099-01-01' };
    expect(component.isBoardOverdue()).toBeFalse();

    component.board = { ...component.board, dueDate: undefined };
    expect(component.isBoardOverdue()).toBeFalse();
  });
});
