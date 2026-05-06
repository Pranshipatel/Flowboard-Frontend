import { UserProfile } from './user.model';

export type BoardMemberRole =
  | 'OBSERVER'
  | 'MEMBER'
  | 'ADMIN';

export interface BoardMember {
  userId: number;
  role: BoardMemberRole;
  addedAt: string;

  user?: UserProfile;
}

export interface BoardAnalytics {
  totalMembers: number;
  observerCount: number;
  memberCount: number;
  adminCount: number;
}

export interface Board {
  id: number;
  workspaceId: number;

  name: string;
  description: string | null;
  background: string | null;

  visibility: 'PUBLIC' | 'PRIVATE';

  createdById: number;
  isClosed: boolean;

  createdAt: string;
  updatedAt: string | null;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  memberCount: number;
  members: BoardMember[];
  analytics: BoardAnalytics;

  // Progress tracking
  totalCards?: number;
  doneCards?: number;
  progressPercentage?: number;
}

export interface CreateBoardRequest {
  workspaceId: number;

  name: string;
  description?: string;
  background?: string;

  visibility: 'PUBLIC' | 'PRIVATE';
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpdateBoardRequest {
  name: string;

  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface PublicBoardCard {
  id: number;
  listId: number;
  boardId: number;
  title: string;
  description: string | null;
  position: number;
  priority: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  isOverdue: boolean;
  coverColor: string | null;
}

export interface PublicBoardList {
  id: number;
  boardId: number;
  name: string;
  position: number;
  color: string | null;
  cards: PublicBoardCard[];
}

export interface PublicBoardDetail {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  background: string | null;
  visibility: 'PUBLIC';
  isClosed: boolean;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lists: PublicBoardList[];
}
