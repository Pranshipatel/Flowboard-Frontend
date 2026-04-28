import { UserProfile } from './user.model';

export interface WorkspaceMember {
  userId: number;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user?: UserProfile;
}

/** Maps to backend WorkspaceMemberResponse DTO returned by addMember / getMembers */
export interface WorkspaceMemberResult {
  id: number;
  userId: number;
  role: string;
  workspaceId: number;
  profile?: { fullName: string; email: string; avatarUrl?: string };
}

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  members: WorkspaceMember[];
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  logoUrl?: string;
}

export interface UpdateWorkspaceRequest {
  name: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  logoUrl?: string;
}

export interface AddMemberRequest {
  userId: number;
  role: 'ADMIN' | 'MEMBER';
}