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

  memberCount: number;
  members: BoardMember[];
  analytics: BoardAnalytics;
}

export interface CreateBoardRequest {
  workspaceId: number;

  name: string;
  description?: string;
  background?: string;

  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateBoardRequest {
  name: string;

  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}