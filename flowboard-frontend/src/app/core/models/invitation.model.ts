export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;

  email: string;
  role: 'ADMIN' | 'MEMBER';

  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

  invitedBy: number;

  createdAt: string;
  expiresAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'ADMIN' | 'MEMBER';
}