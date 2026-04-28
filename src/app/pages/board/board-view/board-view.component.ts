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
import { Board } from '../../../core/models/board.model';
import { TaskList } from '../../../core/models/list.model';
import { Card } from '../../../core/models/card.model';
import { CardCreateComponent } from '../card-create/card-create.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';
import { BoardAnalyticsComponent } from '../board-analytics/board-analytics.component';
import { ArchiveManagerComponent } from '../archive-manager/archive-manager.component';
import { ColorPickerComponent } from '../../..//shared/components/color-picker.component';
import { UpgradePromptComponent } from '../../../shared/components/upgrade-prompt.component';
import { Store } from '@ngrx/store';
import * as BoardActions from '../../../store/board/board.actions';
import { selectLists, selectCards, selectBoardLoading } from '../../../store/board/board.selectors';
import { Subject, takeUntil } from 'rxjs';

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
    BoardAnalyticsComponent, ArchiveManagerComponent, ColorPickerComponent
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
  private snack        = inject(MatSnackBar);
  private dialog       = inject(MatDialog);

  private store        = inject(Store);
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

  boardMembers: Array<{ userId: number; displayName?: string }> = [];

  listForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
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
      });

    this.loadBoard(id);
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

  getCards(listId: number): Card[] {
    return this.allCards.filter(c => c.listId === listId);
  }

  getConnectedLists(): string[] {
    return this.lists.map(l => 'list-' + l.id);
  }

  onListDrop(event: CdkDragDrop<TaskList[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.store.dispatch(BoardActions.moveList({
    boardId: this.board!.id,
    prevIndex: event.previousIndex,
    currentIndex: event.currentIndex,
    orderedListIds: this.lists.map(l => l.id)  // after moveItemInArray
  }));
  }

  onCardDrop(event: CdkDragDrop<Card[]>,
    targetListId: number): void {
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
  }

  onAddListClick(): void {
    if (!this.isPremium) {
      this.dialog.open(UpgradePromptComponent, { width: '400px' });
      return;
    }
    this.showAddList = true;
  }

  onAddCardClick(listId: number): void {
    if (!this.isPremium) {
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
    this.addingList  = false;
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
    this.store.dispatch(BoardActions.updateCard({ card: updated }));
    this.selectedCard = updated;
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

  getArchivedCards(): Card[] {
    return this.getAllCards().filter(c => c.isArchived);
  }

  getArchivedLists(): TaskList[] {
    return this.lists.filter(l => l.isArchived);
  }

  restoreCard(card: Card): void {
    const request = {
      title: card.title,
      isArchived: false,
      description: card.description ?? undefined
    };
    this.cardService.update(card.id, request as any).subscribe({
      next: () => {
        const updated = { ...card, isArchived: false };
        this.store.dispatch(BoardActions.updateCard({ card: updated }));
        this.snack.open('Card restored!', 'Close', { duration: 3000 });
      }
    });
  }

  restoreList(listId: number): void {
    this.listService.unarchive(listId).subscribe({
      next: () => {
        // Quick update to store, ideally should be an action
        const list = this.lists.find(l => l.id === listId);
        if (list) {
           // We can just trigger a full reload of board details
           this.store.dispatch(BoardActions.loadBoardDetails({ boardId: this.board!.id }));
        }
        this.snack.open('List restored!', 'Close', { duration: 3000 });
      }
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