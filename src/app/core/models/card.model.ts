export type Priority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type CardStatus =
  | 'TO_DO'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'DONE';

export interface Card {
  id: number;

  listId: number;
  boardId: number;

  title: string;
  description: string | null;

  position: number;

  priority: Priority;
  status: CardStatus;

  startDate: string | null;
  dueDate: string | null;

  assigneeId: number | null;
  createdById: number;

  isArchived: boolean;
  isOverdue: boolean;

  coverColor: string | null;

  createdAt: string;
  updatedAt: string | null;

  labels?: string[];
}

export interface CardActivity {
  id: number;
  cardId: number;
  actorId: number;

  actionType: string;
  description: string;

  oldValue: string | null;
  newValue: string | null;

  createdAt: string;
}

export interface CreateCardRequest {
  listId: number;
  boardId: number;

  title: string;
  description?: string;

  priority?: Priority;

  dueDate?: string;

  assigneeId?: number;
  coverColor?: string;
}

export interface UpdateCardRequest {
  title: string;

  description?: string;

  priority?: Priority;
  status?: CardStatus;

  startDate?: string;
  dueDate?: string;

  coverColor?: string;
}

export interface MoveCardRequest {
  targetListId: number;
  targetBoardId: number;

  targetPosition?: number;
}