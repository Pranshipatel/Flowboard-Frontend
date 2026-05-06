import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { Workspace } from '../../core/models/workspace.model';
import { Board, PublicBoardDetail } from '../../core/models/board.model';

@Component({
  selector: 'app-guest',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './guest.component.html',
  styleUrl: './guest.component.css'
})
export class GuestComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private workspaceService = inject(WorkspaceService);
  private boardService = inject(BoardService);

  isLoggedIn = this.auth.isLoggedIn();
  loadingPublic = true;
  publicWorkspaces: Workspace[] = [];
  publicBoards: Board[] = [];
  publicBoardDetails: Record<number, PublicBoardDetail[]> = {};
  loadingWorkspaceDetails: Record<number, boolean> = {};
  expandedWorkspaceId: number | null = null;

  showPublicWorkspaces = true;

  ngOnInit(): void {
    this.loadPublicBoards();
  }

  scrollToPublicWorkspaces(): void {
    document.getElementById('public-workspaces-section')?.scrollIntoView({ behavior: 'smooth' });
  }



  loadPublicBoards(): void {
    this.loadingPublic = true;
    this.workspaceService.getPublic().subscribe({
      next: workspaces => {
        this.publicWorkspaces = workspaces;
        this.expandedWorkspaceId = this.publicWorkspaces[0]?.id ?? null;
        if (this.expandedWorkspaceId) {
          this.loadWorkspaceDetails(this.expandedWorkspaceId);
        }

        this.boardService.getPublic().subscribe({
          next: boards => {
            this.publicBoards = boards;
            this.loadingPublic = false;
          },
          error: () => {
            this.publicBoards = [];
            this.loadingPublic = false;
          }
        });
      },
      error: () => {
        this.publicWorkspaces = [];
        this.publicBoards = [];
        this.loadingPublic = false;
      }
    });
  }

  getPublicBoards(workspaceId: number): Board[] {
    return this.publicBoards.filter(board => board.workspaceId === workspaceId && board.visibility === 'PUBLIC');
  }

  toggleWorkspace(workspaceId: number): void {
    this.expandedWorkspaceId = this.expandedWorkspaceId === workspaceId ? null : workspaceId;
    if (this.expandedWorkspaceId === workspaceId && !this.publicBoardDetails[workspaceId]) {
      this.loadWorkspaceDetails(workspaceId);
    }
  }

  loadWorkspaceDetails(workspaceId: number): void {
    this.loadingWorkspaceDetails[workspaceId] = true;
    this.boardService.getPublicWorkspaceDetails(workspaceId).subscribe({
      next: boards => {
        this.publicBoardDetails[workspaceId] = boards;
        this.loadingWorkspaceDetails[workspaceId] = false;
      },
      error: () => {
        this.publicBoardDetails[workspaceId] = [];
        this.loadingWorkspaceDetails[workspaceId] = false;
      }
    });
  }

  getPublicBoardDetails(workspaceId: number): PublicBoardDetail[] {
    return this.publicBoardDetails[workspaceId] ?? [];
  }

  getBoardCardCount(board: PublicBoardDetail): number {
    return board.lists.reduce((total, list) => total + list.cards.length, 0);
  }

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }
}
