import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/models/user.model';
import { Workspace, WorkspaceMemberResult } from '../../../core/models/workspace.model';

@Component({
  selector: 'app-workspace-member-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDialogModule
  ],
  templateUrl: './workspace-member-detail.component.html',
  styleUrl:    './workspace-member-detail.component.css'
})
export class WorkspaceMemberDetailComponent implements OnInit {
  private route            = inject(ActivatedRoute);
  private router           = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private authService      = inject(AuthService);
  private snack            = inject(MatSnackBar);
  private dialog           = inject(MatDialog);

  workspace: Workspace | null = null;
  member: WorkspaceMemberResult | null = null;
  userProfile: UserProfile | null = null;

  loading  = true;
  removing = false;
  currentUserId = 0;
  workspaceId   = 0;
  targetUserId  = 0;
  private loadCount = 0;

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.workspaceId   = Number(this.route.snapshot.paramMap.get('id'));
    this.targetUserId  = Number(this.route.snapshot.paramMap.get('userId'));
    this.loadData();
  }

  loadData(): void {
    this.workspaceService.getById(this.workspaceId).subscribe({
      next: ws => { this.workspace = ws; this.checkDone(); },
      error: () => this.checkDone()
    });
    this.workspaceService.getMembers(this.workspaceId).subscribe({
      next: members => { this.member = members.find(m => m.userId === this.targetUserId) ?? null; this.checkDone(); },
      error: () => this.checkDone()
    });
    this.authService.getUserById(this.targetUserId).subscribe({
      next: profile => { this.userProfile = profile; this.checkDone(); },
      error: () => this.checkDone()
    });
  }

  private checkDone(): void { this.loadCount++; if (this.loadCount >= 3) this.loading = false; }

  get isOwner(): boolean { return this.workspace?.ownerId === this.currentUserId; }
  get memberRole(): string {
    if (!this.member || !this.workspace) return '–';
    if (this.member.userId === this.workspace.ownerId) return 'OWNER';
    return this.member.role;
  }
  get isSelf(): boolean { return this.targetUserId === this.currentUserId; }

  getAvatarBg(seed: number): string {
    const c = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6'];
    return c[seed % c.length];
  }
  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

  removeMember(): void {
    if (!this.isOwner || !this.workspace) return;
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Remove Member',
        message: `Remove ${this.userProfile?.fullName ?? 'User #' + this.targetUserId} from this workspace? They will lose access to all boards.`,
        confirmText: 'Remove Member'
      }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.removing = true;
      this.workspaceService.removeMember(this.workspaceId, this.targetUserId).subscribe({
        next: () => { this.snack.open('Member removed', 'Close', { duration: 3000 }); this.goBack(); },
        error: err => { this.removing = false; this.snack.open(err.error?.message ?? 'Failed to remove member', 'Close', { duration: 4000 }); }
      });
    });
  }

  goBack(): void { this.router.navigate(['/workspace', this.workspaceId]); }
}
