import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-public-workspaces',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './public-workspaces.component.html',
  styleUrl: './public-workspaces.component.css'
})
export class PublicWorkspacesComponent implements OnInit {
  private auth = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  publicWorkspaces: Workspace[] = [];
  loading = true;
  currentUserId = 0;

  ngOnInit(): void {
    this.currentUserId = this.auth.getUserId();
    this.loadPublicWorkspaces();
  }

  loadPublicWorkspaces(): void {
    this.loading = true;
    this.workspaceService.getPublic().subscribe({
      next: workspaces => {
        this.publicWorkspaces = workspaces.filter(workspace => workspace.ownerId !== this.currentUserId);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Failed to load public workspaces', 'Close', { duration: 3000 });
      }
    });
  }

  openWorkspace(id: number): void {
    this.router.navigate(['/workspace', id]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  }
}
