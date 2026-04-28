import { createReducer, on } from '@ngrx/store';
import { initialBoardState, boardAdapter } from './board.state';
import * as BoardActions from './board.actions';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

export const boardReducer = createReducer(
  initialBoardState,
  on(BoardActions.loadBoardsSuccess, (state, { boards }) => 
    boardAdapter.setAll(boards, { ...state, loading: false })
  ),
  on(BoardActions.selectBoard, (state, { id }) => ({
    ...state,
    selectedId: id
  })),
  on(BoardActions.loadBoardDetails, (state) => ({
    ...state,
    loading: true
  })),
  on(BoardActions.loadBoardDetailsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(BoardActions.loadBoardDetailsSuccess, (state, { lists, cards }) => ({
    ...state,
    lists,
    cards,
    loading: false
  })),
  on(BoardActions.moveCard, (state, { cardId, fromListId, toListId, prevIndex, currentIndex }) => {
  const newCards = state.cards.map(c => ({ ...c }));

  if (fromListId === toListId) {
    // FIX: implement same-list reorder using position field
    const listCards = newCards
      .filter(c => c.listId === fromListId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    // Move the card from prevIndex to currentIndex in the sorted array
    const [moved] = listCards.splice(prevIndex, 1);
    listCards.splice(currentIndex, 0, moved);

    // Reassign positions
    listCards.forEach((card, idx) => {
      const globalIdx = newCards.findIndex(c => c.id === card.id);
      if (globalIdx > -1) newCards[globalIdx] = { ...newCards[globalIdx], position: idx };
    });

    return { ...state, cards: newCards };
  } else {
    // Moving to a different list
    const cardIdx = newCards.findIndex(c => c.id === cardId);
    if (cardIdx > -1) {
      newCards[cardIdx] = { ...newCards[cardIdx], listId: toListId, position: currentIndex };
    }
    return { ...state, cards: newCards };
  }
}),
  on(BoardActions.moveCardFailure, (state, { cardId, originalListId }) => {
    const newCards = [...state.cards];
    const cardIdx = newCards.findIndex(c => c.id === cardId);
    if (cardIdx > -1) {
      newCards[cardIdx] = { ...newCards[cardIdx], listId: originalListId };
    }
    return { ...state, cards: newCards };
  }),
  on(BoardActions.moveList, (state, { prevIndex, currentIndex }) => {
    const newLists = [...state.lists];
    moveItemInArray(newLists, prevIndex, currentIndex);
    return { ...state, lists: newLists };
  }),
  on(BoardActions.moveListFailure, (state, { originalIndex, newIndex }) => {
    const newLists = [...state.lists];
    moveItemInArray(newLists, newIndex, originalIndex); // revert
    return { ...state, lists: newLists };
  }),
  on(BoardActions.addListSuccess, (state, { list }) => ({
    ...state,
    lists: [...state.lists, list]
  })),
  on(BoardActions.updateList, (state, { list }) => {
    const newLists = [...state.lists];
    const idx = newLists.findIndex(l => l.id === list.id);
    if (idx > -1) {
      newLists[idx] = list;
    }
    return { ...state, lists: newLists };
  }),
  on(BoardActions.archiveList, (state, { listId }) => {
    return {
      ...state,
      lists: state.lists.map(l => l.id === listId ? { ...l, isArchived: true } : l)
    };
  }),
  on(BoardActions.archiveListFailure, (state, { listId }) => {
    return {
      ...state,
      lists: state.lists.map(l => l.id === listId ? { ...l, isArchived: false } : l)
    };
  }),
  on(BoardActions.deleteListSuccess, (state, { listId }) => ({
    ...state,
    lists: state.lists.filter(l => l.id !== listId),
    cards: state.cards.filter(c => c.listId !== listId)
  })),
  on(BoardActions.addCard, (state, { card }) => ({
    ...state,
    cards: [...state.cards, card]
  })),
  on(BoardActions.updateCard, (state, { card }) => {
    const newCards = [...state.cards];
    const idx = newCards.findIndex(c => c.id === card.id);
    if (idx > -1) {
      newCards[idx] = card;
    }
    return { ...state, cards: newCards };
  }),
  on(BoardActions.deleteCard, (state, { cardId }) => ({
    ...state,
    cards: state.cards.filter(c => c.id !== cardId)
  }))
);
