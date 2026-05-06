import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  CdkDragDrop, DragDropModule,
  moveItemInArray, transferArrayItem
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDividerModule } from '@angular/material/divider';
import { BoardService } from '../../../core/services/board.service';
import { ListService } from '../../../core/services/list.service';
import { CardService } from '../../../core/services/card.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Board } from '../../../core/models/board.model';
import { TaskList } from '../../../core/models/list.model';
import { Card } from '../../../core/models/card.model';
import { UserProfile } from '../../../core/models/user.model';
import { CardCreateComponent } from '../card-create/card-create.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';
import { BoardAnalyticsComponent } from '../board-analytics/board-analytics.component';
import { ArchiveManagerComponent } from '../archive-manager/archive-manager.component';
import { ColorPickerComponent } from '../../..//shared/components/color-picker.component';
import { UpgradePromptComponent } from '../../../shared/components/upgrade-prompt.component';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import * as BoardActions from '../../../store/board/board.actions';
import { selectLists, selectCards, selectBoardLoading } from '../../../store/board/board.selectors';
import { forkJoin, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    DragDropModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatMenuModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatDividerModule, MatDialogModule,
    CardCreateComponent, CardDetailComponent,
    BoardAnalyticsComponent, ArchiveManagerComponent
  ],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.css'
})
export class BoardViewComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);
  private boardService = inject(BoardService);
  private listService  = inject(ListService);
  private cardService  = inject(CardService);
  private paymentService = inject(PaymentService);
  private authService  = inject(AuthService);
  private snack        = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  private store        = inject(Store);
  private actions$     = inject(Actions);
  private destroy$     = new Subject<void>();

  board: Board | null = null;
  lists: TaskList[]   = [];
  allCards: Card[]    = []; // flat list of cards from store
  loading      = true;
  addingList   = false;
  showAddList  = false;
  selectedCard: Card | null = null;
  showCardDetail = false;
  activeAddCardListId: number | null = null;
  showAnalytics = false;
  showArchive   = false;
  isPremium     = false;
  isGuest       = false;
  menuOpen      = false;
  readonly freeListLimit = 2;
  readonly freeCardLimit = 2;

  boardMembers: Array<{ userId: number; displayName?: string }> = [];
  creatorProfiles: Record<number, UserProfile> = {};
  loadingCreatorIds = new Set<number>();
  archivedCardsFetched: Card[] = [];
  archivedListsFetched: TaskList[] = [];

  listForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    this.isGuest = !this.authService.isLoggedIn() || this.router.url.startsWith('/guest/board');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (this.isGuest) {
      this.loadPublicBoard(id);
      return;
    }

    this.store.dispatch(BoardActions.selectBoard({ id }));
    
    // Check Subscription
    this.paymentService.subscriptionStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS';
      });

    // Subscribe to loading state
    this.store.select(selectBoardLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    // Subscribe to lists
    this.store.select(selectLists)
      .pipe(takeUntil(this.destroy$))
      .subscribe(lists => this.lists = lists);

    // Subscribe to cards
    this.store.select(selectCards)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cards => {
        this.allCards = cards;
        this.loadCreatorProfiles(cards);
        this.checkQueryParamForCard();
      });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.currentQueryCardId = params['cardId'] ? Number(params['cardId']) : null;
      this.checkQueryParamForCard();
    });

    this.actions$.pipe(
      ofType(BoardActions.addListSuccess),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.addingList = false;
      this.snack.open('List added', 'Close', { duration: 2000 });
    });

    this.actions$.pipe(
      ofType(BoardActions.addListFailure),
      takeUntil(this.destroy$)
    ).subscribe(({ error }) => {
      this.addingList = false;
      this.snack.open(error, 'Close', { duration: 3000 });
      if (error.toLowerCase().includes('free users')) {
        this.dialog.open(UpgradePromptComponent, { width: '400px' });
      }
    });

    this.loadBoard(id);
  }

  currentQueryCardId: number | null = null;

  checkQueryParamForCard(): void {
    if (this.currentQueryCardId && this.allCards.length > 0) {
      const card = this.allCards.find(c => c.id === this.currentQueryCardId);
      if (card && !this.showCardDetail) {
        this.openCardDetail(card);
        // Clear the query param so it doesn't keep opening if the user closes the modal
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { cardId: null },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoard(id: number): void {
    // Note: selectBoard$ effect already dispatched loadBoardDetails({ boardId: id })
    // to load lists + cards. We just need the board metadata here.
    this.boardService.getById(id).subscribe({
      next: b => {
        this.board = b;
        this.boardMembers = (b.members || []).map((m: any) => ({
          userId: m.userId,
          displayName: m.user?.fullName,
          avatarUrl: m.user?.avatarUrl
        }));
        // DON'T dispatch loadBoardDetails again — doing so cancels the
        // already-running request (switchMap) and doubles the load time.
        // It also risks overwriting freshly-added lists with stale server data.
      },
      error: () => {
        this.loading = false;
        this.snack.open('Board not found', 'Close', { duration: 3000 });
      }
    });
  }

  loadPublicBoard(id: number): void {
    this.loading = true;
    this.boardService.getPublicDetail(id).subscribe({
      next: publicBoard => {
        const now = new Date().toISOString();
        this.board = {
          id: publicBoard.id,
          workspaceId: publicBoard.workspaceId,
          name: publicBoard.name,
          description: publicBoard.description,
          background: publicBoard.background,
          visibility: publicBoard.visibility,
          createdById: 0,
          isClosed: publicBoard.isClosed,
          createdAt: now,
          updatedAt: null,
          dueDate: publicBoard.dueDate,
          priority: publicBoard.priority,
          memberCount: 0,
          members: [],
          analytics: { totalMembers: 0, observerCount: 0, memberCount: 0, adminCount: 0 }
        };
        this.lists = publicBoard.lists.map(list => ({
          id: list.id,
          boardId: list.boardId,
          name: list.name,
          position: list.position,
          color: list.color,
          isArchived: false,
          createdAt: now,
          updatedAt: null,
          cardCount: list.cards.length
        }));
        this.allCards = publicBoard.lists.flatMap(list => list.cards.map(card => ({
          id: card.id,
          listId: card.listId,
          boardId: card.boardId,
          title: card.title,
          description: card.description,
          position: card.position,
          priority: card.priority as any,
          status: card.status as any,
          startDate: card.startDate ?? null,
          dueDate: card.dueDate ?? null,
          assigneeId: null,
          createdById: 0,
          isArchived: false,
          isOverdue: card.isOverdue,
          coverColor: card.coverColor,
          createdAt: now,
          updatedAt: null
        })));
        this.boardMembers = [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Public board not found', 'Close', { duration: 3000 });
        this.router.navigate(['/guest']);
      }
    });
  }

  getCards(listId: number): Card[] {
    return this.allCards.filter(c => c.listId === listId && !c.isArchived && !(c as any).archived);
  }

  loadCreatorProfiles(cards: Card[]): void {
    const creatorIds = Array.from(new Set(cards.map(card => card.createdById).filter(Boolean)));
    const missingIds = creatorIds.filter(id => !this.creatorProfiles[id] && !this.loadingCreatorIds.has(id));
    if (missingIds.length === 0) return;

    missingIds.forEach(id => this.loadingCreatorIds.add(id));
    forkJoin(missingIds.map(id => this.authService.getUserById(id))).subscribe({
      next: profiles => {
        profiles.forEach(profile => {
          this.creatorProfiles[profile.id] = profile;
          this.loadingCreatorIds.delete(profile.id);
        });
      },
      error: () => {
        missingIds.forEach(id => this.loadingCreatorIds.delete(id));
      }
    });
  }

  getCardCreator(card: Card): UserProfile | null {
    return this.creatorProfiles[card.createdById] ?? null;
  }

  getCreatorInitials(card: Card): string {
    if (!card.createdById) return 'FB';
    const creator = this.getCardCreator(card);
    const name = creator?.fullName || creator?.username || `User ${card.createdById}`;
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }

  getCreatorName(card: Card): string {
    if (!card.createdById) return 'FlowBoard community';
    const creator = this.getCardCreator(card);
    return creator?.fullName || creator?.username || `User #${card.createdById}`;
  }

  getActiveLists(): TaskList[] {
    return this.lists.filter(l => !l.isArchived && !(l as any).archived);
  }

  getConnectedLists(): string[] {
    return this.getActiveLists().map(l => 'list-' + l.id);
  }

  onListDrop(event: CdkDragDrop<TaskList[]>): void {
    if (this.isGuest) return;
    if (event.previousIndex === event.currentIndex) return;
    this.store.dispatch(BoardActions.moveList({
      boardId: this.board!.id,
      prevIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      orderedListIds: this.getActiveLists().map(l => l.id)
    }));
  }

  onCardDrop(event: CdkDragDrop<Card[]>,
    targetListId: number): void {
    if (this.isGuest) return;
    const card = event.previousContainer.data[event.previousIndex];
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
    }
    
    this.store.dispatch(BoardActions.moveCard({
      cardId: card.id,
      fromListId: card.listId,
      toListId: targetListId,
      prevIndex: event.previousIndex,
      currentIndex: event.currentIndex
    }));

    // Auto-update status based on target list name
    const targetList = this.lists.find(l => l.id === targetListId);
    if (targetList) {
      const lowerName = targetList.name.toLowerCase();
      let newStatus = null;
      if (lowerName.includes('to do') || lowerName.includes('todo')) newStatus = 'TO_DO';
      else if (lowerName.includes('progress')) newStatus = 'IN_PROGRESS';
      else if (lowerName.includes('review')) newStatus = 'IN_REVIEW';
      else if (lowerName.includes('done')) newStatus = 'DONE';

      if (newStatus && card.status !== newStatus) {
        this.cardService.setStatus(card.id, newStatus as any).subscribe({
          next: updated => this.store.dispatch(BoardActions.updateCard({ card: updated }))
        });
      }
    }
  }

  toggleCardStatus(card: Card, event: Event): void {
    event.stopPropagation();
    if (this.isGuest) return;
    const newStatus = card.status === 'DONE' ? 'TO_DO' : 'DONE';
    
    // Auto-move card to corresponding list if it exists
    let targetListId = card.listId;
    const targetList = this.lists.find(l => {
       const lowerName = l.name.toLowerCase();
       if (newStatus === 'DONE' && lowerName.includes('done')) return true;
       if (newStatus === 'TO_DO' && (lowerName.includes('to do') || lowerName.includes('todo'))) return true;
       return false;
    });
    if (targetList) {
       targetListId = targetList.id;
    }

    this.cardService.setStatus(card.id, newStatus as any).subscribe({
      next: updated => {
        if (targetListId !== card.listId) {
           this.cardService.move(card.id, {
              targetListId: targetListId,
              targetBoardId: card.boardId
           }).subscribe({
              next: finalCard => this.store.dispatch(BoardActions.updateCard({ card: finalCard }))
           });
        } else {
           this.store.dispatch(BoardActions.updateCard({ card: updated }));
        }
      },
      error: () => this.snack.open('Failed to update status', 'Close', { duration: 3000 })
    });
  }

  onAddListClick(): void {
    if (!this.isPremium && this.getActiveLists().length >= this.freeListLimit) {
      this.snack.open('Free users can create up to 2 lists. Upgrade for unlimited lists.', 'Close', { duration: 3000 });
      this.dialog.open(UpgradePromptComponent, { width: '400px' });
      return;
    }
    this.showAddList = true;
  }

  onAddCardClick(listId: number): void {
    if (!this.isPremium && this.allCards.filter(c => !c.isArchived && !(c as any).archived).length >= this.freeCardLimit) {
      this.snack.open('Free users can create up to 2 cards. Upgrade for unlimited cards.', 'Close', { duration: 3000 });
      this.dialog.open(UpgradePromptComponent, { width: '400px' });
      return;
    }
    this.activeAddCardListId = listId;
  }

  addList(): void {
    if (this.listForm.invalid) return;
    this.addingList = true;
    this.store.dispatch(BoardActions.addList({
      boardId: this.board!.id,
      name: this.listForm.value.name!
    }));
    this.listForm.reset();
    this.showAddList = false;
  }

  updateListColor(list: TaskList, color: string | null): void {
    this.listService.update(list.id, {
      name: list.name,
      color: color || undefined
    }).subscribe({
      next: updatedList => {
        this.store.dispatch(BoardActions.updateList({ list: updatedList }));
        this.snack.open('List color updated!', 'Close', { duration: 2000 });
      },
      error: () => this.snack.open('Failed to update list color', 'Close', { duration: 3000 })
    });
  }

  onCardCreated(card: Card, listId: number): void {
    this.store.dispatch(BoardActions.addCard({ card }));
    this.snack.open('Card added', 'Close', { duration: 2000 });
  }

  onCardCreateFailed(error: string): void {
    this.snack.open(error, 'Close', { duration: 3000 });
    if (error.toLowerCase().includes('free users')) {
      this.dialog.open(UpgradePromptComponent, { width: '400px' });
    }
  }

  openCardDetail(card: Card): void {
    this.selectedCard  = card;
    this.showCardDetail = true;
  }

  closeCardDetail(): void {
    this.showCardDetail = false;
    this.selectedCard   = null;
  }

  onCardUpdated(updated: Card): void {
    // If status was changed via modal, check if we need to auto-move it
    let targetListId = updated.listId;
    const targetList = this.lists.find(l => {
       const lowerName = l.name.toLowerCase();
       if (updated.status === 'DONE' && lowerName.includes('done')) return true;
       if (updated.status === 'IN_PROGRESS' && lowerName.includes('progress')) return true;
       if (updated.status === 'IN_REVIEW' && lowerName.includes('review')) return true;
       if (updated.status === 'TO_DO' && (lowerName.includes('to do') || lowerName.includes('todo'))) return true;
       return false;
    });
    if (targetList && targetList.id !== updated.listId) {
        updated.listId = targetList.id;
        this.cardService.move(updated.id, {
            targetListId: targetList.id,
            targetBoardId: updated.boardId
        }).subscribe({
           next: finalCard => {
             this.store.dispatch(BoardActions.updateCard({ card: finalCard }));
             this.selectedCard = finalCard;
           }
        });
    } else {
        this.store.dispatch(BoardActions.updateCard({ card: updated }));
        this.selectedCard = updated;
    }
  }

  onCardDeleted(data: { cardId: number; listId: number }): void {
    this.store.dispatch(BoardActions.deleteCard({ cardId: data.cardId, listId: data.listId }));
    this.closeCardDetail();
  }

  archiveList(listId: number): void {
    this.store.dispatch(BoardActions.archiveList({ listId }));
    this.snack.open('List archived!', 'Close', { duration: 3000 });
  }

  deleteList(listId: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete List',
        message: 'Are you sure you want to permanently delete this list? All tasks within it will be deleted.',
        confirmText: 'Delete List'
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.store.dispatch(BoardActions.deleteList({ listId }));
      }
    });
  }

  deleteCardDirect(card: Card, e: Event): void {
    e.stopPropagation(); // prevent opening Card Detail
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Card',
        message: `Are you sure you want to delete "${card.title}" permanently?`,
        confirmText: 'Delete Card'
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.cardService.delete(card.id).subscribe({
          next: () => {
            this.store.dispatch(BoardActions.deleteCard({ cardId: card.id, listId: card.listId }));
            this.snack.open('Card deleted', 'Close', { duration: 2000 });
          },
          error: () => this.snack.open('Failed to delete card', 'Close', { duration: 3000 })
        });
      }
    });
  }

  getPriorityColor(p: string): string {
    const map: Record<string, string> = {
      LOW: '#22c55e', MEDIUM: '#f59e0b',
      HIGH: '#ef4444', CRITICAL: '#7c3aed'
    };
    return map[p] ?? '#94a3b8';
  }

  goBack(): void {
    window.history.back();
  }

  // --- Advanced Analytics & Archive ---

  getAllCards(): Card[] {
    return this.allCards;
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }
  
  isBoardOverdue(): boolean {
    if (!this.board || !this.board.dueDate || this.board.isClosed) return false;
    return new Date(this.board.dueDate) < new Date();
  }

  openArchiveMenu(): void {
    if (!this.board) return;
    this.showArchive = true;
    
    this.cardService.getArchivedByBoard(this.board.id).subscribe({
       next: (cards) => this.archivedCardsFetched = cards
    });

    this.listService.getArchived(this.board.id).subscribe({
       next: (lists) => this.archivedListsFetched = lists
    });
  }

  restoreCard(card: Card): void {
    this.cardService.unarchive(card.id).subscribe({
      next: (updated) => {
        this.archivedCardsFetched = this.archivedCardsFetched.filter(c => c.id !== card.id);
        this.store.dispatch(BoardActions.updateCard({ card: updated }));
        this.snack.open('Card restored!', 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to restore card', 'Close', { duration: 3000 })
    });
  }

  restoreList(listId: number): void {
    this.listService.unarchive(listId).subscribe({
      next: () => {
        this.archivedListsFetched = this.archivedListsFetched.filter(l => l.id !== listId);
        this.store.dispatch(BoardActions.loadBoardDetails({ boardId: this.board!.id }));
        this.snack.open('List restored!', 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to restore list', 'Close', { duration: 3000 })
    });
  }

  updateVisibility(visibility: 'PUBLIC' | 'PRIVATE'): void {
    if (!this.board) return;
    this.boardService.update(this.board.id, {
      name: this.board.name,
      visibility
    }).subscribe({
      next: updated => {
        this.board = updated;
        this.snack.open(`Board is now ${visibility}`, 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update visibility', 'Close', { duration: 3000 })
    });
  }

  deleteBoard(): void {
    if (!this.board) return;

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Board',
        message: 'Are you sure you want to delete this board? This cannot be undone.',
        confirmText: 'Delete Board'
      }
    }).afterClosed().subscribe(result => {
      if (!result) return;
      const workspaceId = this.board!.workspaceId;
      this.boardService.delete(this.board!.id).subscribe({
        next: () => {
          this.snack.open('Board deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/workspace', workspaceId]);
        },
        error: () => this.snack.open('Failed to delete board', 'Close', { duration: 3000 })
      });
    });
  }
}
