import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { GuestComponent } from './guest.component';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { Board, PublicBoardDetail } from '../../core/models/board.model';
import { Workspace } from '../../core/models/workspace.model';

describe('GuestComponent', () => {
  let fixture: ComponentFixture<GuestComponent>;
  let component: GuestComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let workspaceService: jasmine.SpyObj<WorkspaceService>;
  let boardService: jasmine.SpyObj<BoardService>;

  const workspaces: Workspace[] = [
    createWorkspace(1, 'Design Lab'),
    createWorkspace(2, 'Product Team')
  ];

  const boards: Board[] = [
    createBoard(10, 1, 'Public Roadmap', 'PUBLIC', false, 7),
    createBoard(11, 1, 'Private Planning', 'PRIVATE', false, 3),
    createBoard(12, 2, 'Closed Board', 'PUBLIC', true, 5),
    createBoard(13, 999, 'Orphan Board', 'PUBLIC', false, 2)
  ];

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    workspaceService = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['getPublic']);
    boardService = jasmine.createSpyObj<BoardService>('BoardService', ['getPublic', 'getPublicWorkspaceDetails']);

    authService.isLoggedIn.and.returnValue(false);
    workspaceService.getPublic.and.returnValue(of(workspaces));
    boardService.getPublic.and.returnValue(of(boards));
    boardService.getPublicWorkspaceDetails.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [GuestComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: WorkspaceService, useValue: workspaceService },
        { provide: BoardService, useValue: boardService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestComponent);
    component = fixture.componentInstance;
  });

  it('should create and read logged-out state from auth service', () => {
    expect(component).toBeTruthy();
    expect(component.isLoggedIn).toBeFalse();
    expect(authService.isLoggedIn).toHaveBeenCalled();
  });

  it('should load public workspaces and keep only open public boards from public workspaces', () => {
    fixture.detectChanges();

    expect(component.loadingPublic).toBeFalse();
    expect(component.publicWorkspaces).toEqual(workspaces);
    expect(component.publicBoards.map(board => board.id)).toEqual([10]);
    expect(component.expandedWorkspaceId).toBe(1);
    expect(boardService.getPublicWorkspaceDetails).toHaveBeenCalledWith(1);
  });

  it('should fall back to an empty public list when public APIs fail', () => {
    workspaceService.getPublic.and.returnValue(throwError(() => new Error('workspace failed')));
    boardService.getPublic.and.returnValue(throwError(() => new Error('board failed')));

    fixture.detectChanges();

    expect(component.loadingPublic).toBeFalse();
    expect(component.publicWorkspaces).toEqual([]);
    expect(component.publicBoards).toEqual([]);
    expect(component.expandedWorkspaceId).toBeNull();
  });

  it('should toggle a workspace and load details only the first time it opens', () => {
    fixture.detectChanges();
    boardService.getPublicWorkspaceDetails.calls.reset();

    component.toggleWorkspace(2);
    expect(component.expandedWorkspaceId).toBe(2);
    expect(boardService.getPublicWorkspaceDetails).toHaveBeenCalledOnceWith(2);

    component.publicBoardDetails[2] = [createPublicBoardDetail(20, 2, 'Existing Details')];
    boardService.getPublicWorkspaceDetails.calls.reset();

    component.toggleWorkspace(2);
    expect(component.expandedWorkspaceId).toBeNull();

    component.toggleWorkspace(2);
    expect(component.expandedWorkspaceId).toBe(2);
    expect(boardService.getPublicWorkspaceDetails).not.toHaveBeenCalled();
  });

  it('should use service board details when they are available', () => {
    const details = [createPublicBoardDetail(30, 1, 'Detailed Board', 2, 3)];
    boardService.getPublicWorkspaceDetails.and.returnValue(of(details));

    component.loadWorkspaceDetails(1);

    expect(component.loadingWorkspaceDetails[1]).toBeFalse();
    expect(component.publicBoardDetails[1]).toEqual(details);
    expect(component.getBoardCardCount(details[0])).toBe(5);
  });

  it('should fall back to filtered public boards when workspace details fail', () => {
    component.publicBoards = [
      createBoard(40, 1, 'Fallback Board', 'PUBLIC', false, 4),
      createBoard(41, 2, 'Other Board', 'PUBLIC', false, 1)
    ];
    boardService.getPublicWorkspaceDetails.and.returnValue(throwError(() => new Error('details failed')));

    component.loadWorkspaceDetails(1);

    expect(component.loadingWorkspaceDetails[1]).toBeFalse();
    expect(component.publicBoardDetails[1].map(board => board.id)).toEqual([40]);
    expect(component.publicBoardDetails[1][0].lists).toEqual([]);
  });

  it('should calculate board totals and workspace initials', () => {
    expect(component.getBoardCardTotal(createBoard(50, 1, 'Metrics', 'PUBLIC', false, 9))).toBe(9);
    expect(component.getBoardCardTotal({ ...createBoard(51, 1, 'No Metrics'), totalCards: undefined })).toBe(0);
    expect(component.getInitials('Design Platform Team')).toBe('DP');
    expect(component.getInitials('ops')).toBe('O');
  });

  it('should scroll to the public workspace section', () => {
    const scrollIntoView = jasmine.createSpy('scrollIntoView');
    spyOn(document, 'getElementById').and.returnValue({ scrollIntoView } as unknown as HTMLElement);

    component.scrollToPublicWorkspaces();

    expect(document.getElementById).toHaveBeenCalledWith('public-workspaces-section');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});

function createWorkspace(id: number, name: string): Workspace {
  return {
    id,
    name,
    description: `${name} description`,
    ownerId: 100 + id,
    visibility: 'PUBLIC',
    logoUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    members: []
  };
}

function createBoard(
  id: number,
  workspaceId: number,
  name: string,
  visibility: 'PUBLIC' | 'PRIVATE' = 'PUBLIC',
  isClosed = false,
  totalCards?: number
): Board {
  return {
    id,
    workspaceId,
    name,
    description: `${name} description`,
    background: null,
    visibility,
    createdById: 200 + id,
    isClosed,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    memberCount: 0,
    members: [],
    analytics: {
      totalMembers: 0,
      observerCount: 0,
      memberCount: 0,
      adminCount: 0
    },
    totalCards,
    doneCards: 0,
    progressPercentage: 0
  };
}

function createPublicBoardDetail(
  id: number,
  workspaceId: number,
  name: string,
  firstListCards = 0,
  secondListCards = 0
): PublicBoardDetail {
  return {
    id,
    workspaceId,
    name,
    description: `${name} description`,
    background: null,
    visibility: 'PUBLIC',
    isClosed: false,
    lists: [
      {
        id: id * 10,
        boardId: id,
        name: 'Todo',
        position: 0,
        color: null,
        cards: Array.from({ length: firstListCards }, (_, index) => createPublicCard(id, index))
      },
      {
        id: id * 10 + 1,
        boardId: id,
        name: 'Done',
        position: 1,
        color: null,
        cards: Array.from({ length: secondListCards }, (_, index) => createPublicCard(id, index + firstListCards))
      }
    ]
  };
}

function createPublicCard(boardId: number, index: number) {
  return {
    id: boardId * 100 + index,
    listId: boardId * 10,
    boardId,
    title: `Card ${index + 1}`,
    description: null,
    position: index,
    priority: 'MEDIUM',
    status: index % 2 === 0 ? 'TODO' : 'DONE',
    isOverdue: false,
    coverColor: null
  };
}
