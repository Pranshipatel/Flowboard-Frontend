import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, forkJoin } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom } from 'rxjs/operators';
import { BoardService } from '../../core/services/board.service';
import { ListService } from '../../core/services/list.service';
import { CardService } from '../../core/services/card.service';
import * as BoardActions from './board.actions';
import { selectSelectedBoardId } from './board.selectors';

@Injectable()
export class BoardEffects {
  private actions$     = inject(Actions);
  private store        = inject(Store);
  private boardService = inject(BoardService);
  private listService  = inject(ListService);
  private cardService  = inject(CardService);

  loadBoards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.loadBoards),
      switchMap(({ workspaceId }) =>
        this.boardService.getByWorkspace(workspaceId).pipe(
          map(boards => BoardActions.loadBoardsSuccess({ boards })),
          catchError(error => of(BoardActions.loadBoardsFailure({
            error: error.error?.message || 'Failed to load boards' })))
        )
      )
    )
  );

  selectBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.selectBoard),
      map(({ id }) => BoardActions.loadBoardDetails({ boardId: id }))
    )
  );

  loadBoardDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.loadBoardDetails),
      switchMap(({ boardId }) =>
        forkJoin({
          lists: this.listService.getByBoard(boardId).pipe(catchError(() => of([]))),
          cards: this.cardService.getByBoard(boardId).pipe(catchError(() => of([])))
        }).pipe(
          map(({ lists, cards }) => BoardActions.loadBoardDetailsSuccess({ lists, cards })),
          catchError(error => of(BoardActions.loadBoardDetailsFailure({
            error: error.error?.message || 'Failed to load board details' })))
        )
      )
    )
  );

  moveCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.moveCard),
      withLatestFrom(this.store.select(selectSelectedBoardId)),
      switchMap(([{ cardId, fromListId, toListId, prevIndex, currentIndex }, boardId]) =>
        this.cardService.move(cardId, {
          targetListId:  toListId,
          targetBoardId: boardId ?? 0,
          targetPosition: currentIndex
        }).pipe(
          map(() => BoardActions.moveCardSuccess()),
          catchError(error => of(BoardActions.moveCardFailure({
            error: error.error?.message || 'Failed to sync card movement',
            cardId, originalListId: fromListId, originalIndex: prevIndex
          })))
        )
      )
    )
  );
  
  moveList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.moveList),
      switchMap(({ boardId, orderedListIds }) =>
        this.listService.reorder({ boardId, orderedListIds }).pipe(
          map(() => BoardActions.moveListSuccess()),
          catchError(error => of(BoardActions.moveListFailure({
            error: error.error?.message || 'Failed to sync list order',
            originalIndex: 0, newIndex: 0
          })))
        )
      )
    )
  );

  addList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.addList),
      switchMap(({ boardId, name }) =>
        this.listService.create({ boardId, name }).pipe(
          map(list => BoardActions.addListSuccess({ list })),
          catchError(error => of(BoardActions.addListFailure({
            error: error.error?.message || 'Failed to create list' })))
        )
      )
    )
  );

  archiveList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.archiveList),
      switchMap(({ listId }) =>
        this.listService.archive(listId).pipe(
          map(() => BoardActions.archiveListSuccess({ listId })),
          catchError(error => of(BoardActions.archiveListFailure({
            error: error.error?.message || 'Failed to archive list', listId })))
        )
      )
    )
  );

  deleteList$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.deleteList),
      switchMap(({ listId }) =>
        this.listService.delete(listId).pipe(
          map(() => BoardActions.deleteListSuccess({ listId })),
          catchError(error => of(BoardActions.deleteListFailure({
            error: error.error?.message || 'Failed to delete list', listId })))
        )
      )
    )
  );

  updateCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.updateCard),
      switchMap(({ card }) =>
        this.cardService.update(card.id, card as any).pipe(
          map(() => ({ type: '[Board] Update Card Success' })),
          catchError(error => of({ type: '[Board] Update Card Failure', error }))
        )
      )
    )
  );
}