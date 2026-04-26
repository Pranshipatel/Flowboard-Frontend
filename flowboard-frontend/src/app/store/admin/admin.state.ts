import { UserProfile } from '../../core/models/user.model';
import { Workspace } from '../../core/models/workspace.model';
import { Board } from '../../core/models/board.model';

export interface AdminState {
  users: UserProfile[];
  workspaces: Workspace[];
  boards: Board[];
  stats: {
    totalUsers: number;
    totalWorkspaces: number;
    totalBoards: number;
    activeUsersToday: number;
  } | null;
  loading: boolean;
  error: string | null;
}

export const initialAdminState: AdminState = {
  users: [],
  workspaces: [],
  boards: [],
  stats: null,
  loading: false,
  error: null
};
