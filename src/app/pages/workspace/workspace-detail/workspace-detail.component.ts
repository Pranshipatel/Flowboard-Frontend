import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, switchMap, of, Subject, forkJoin, takeUntil } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { BoardService } from '../../../core/services/board.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ColorPickerComponent } from '../../../shared/components/color-picker.component';
import { UpgradePromptComponent } from '../../../shared/components/upgrade-prompt.component';
import { Workspace, WorkspaceMemberResult } from '../../../core/models/workspace.model';
import { Board } from '../../../core/models/board.model';
import { UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    ColorPickerComponent, MatDialogModule
  ],
  templateUrl: './workspace-detail.component.html',
  styleUrl: './workspace-detail.component.css'
})
export class WorkspaceDetailComponent implements OnInit {

  private route            = inject(ActivatedRoute);
  public  router           = inject(Router);
  private fb               = inject(FormBuilder);
  private workspaceService = inject(WorkspaceService);
  private boardService     = inject(BoardService);
  private authService      = inject(AuthService);
  private paymentService   = inject(PaymentService);
  private snack            = inject(MatSnackBar);
  private dialog           = inject(MatDialog);
  private destroy$         = new Subject<void>();

  workspace: Workspace | null = null;
  boards: Board[] = [];
  members: WorkspaceMemberResult[] = [];

  loading         = true;
  loadingMembers  = false;
  addingMember    = false;
  showCreateBoard = false;
  creatingBoard   = false;
  isPremium       = false;
  readonly freeBoardLimit = 2;

  userId    = 0;
  activeTab: 'boards' | 'settings' = 'boards';

  emailQuery    = '';
  foundUser: UserProfile | null = null;
  searchingUser = false;
  searchError   = '';
  selectedRole: 'ADMIN' | 'MEMBER' = 'MEMBER';

  private emailSearch$ = new Subject<string>();

  boardForm = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    background:  ['#4f46e5'],
    visibility:  ['PRIVATE', Validators.required],
    dueDate:     [''],
    priority:    ['']
  });

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    const id    = Number(this.route.snapshot.paramMap.get('id'));

    // Track subscription status
    this.paymentService.subscriptionStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isPremium = status === 'PREMIUM' || status === 'PRO' || status === 'BUSINESS'
                         || this.paymentService.isPaidPlan();
      });

    this.loadWorkspace(id);
    this.loadBoards(id);

    this.emailSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(email => {
        if (!email || !email.includes('@')) {
          this.foundUser = null; this.searchError = ''; this.searchingUser = false;
          return of([]);
        }
        this.searchingUser = true; this.searchError = '';
        return this.authService.searchUsers(email);
      })
    ).subscribe({
      next: users => {
        this.searchingUser = false;
        if (users.length === 0) {
          this.foundUser = null;
          this.searchError = this.emailQuery ? 'No user found with that email.' : '';
        } else {
          const exact = users.find(u => u.email.toLowerCase() === this.emailQuery.toLowerCase());
          this.foundUser = exact ?? users[0];
          this.searchError = '';
        }
      },
      error: () => { this.searchingUser = false; this.searchError = 'Search failed. Please try again.'; }
    });
  }

  loadWorkspace(id: number): void {
    this.workspaceService.getById(id).subscribe({
      next: ws => {
        this.workspace = ws;
        if (ws.visibility === 'PRIVATE') {
          this.boardForm.patchValue({ visibility: 'PRIVATE' });
        }
        this.loading = false;
        this.loadMembers();
      },
      error: () => { this.loading = false; }
    });
  }

  loadBoards(id: number): void {
    this.boardService.getByWorkspace(id).subscribe({ next: boards => { this.boards = boards; }, error: () => {} });
  }

  loadMembers(): void {
    if (!this.workspace) return;
    this.loadingMembers = true;
    this.workspaceService.getMembers(this.workspace.id).subscribe({
      next: members => {
        if (members.length === 0) {
          this.members = [];
          this.loadingMembers = false;
          return;
        }
        // Enrich each member with their real profile from auth-service
        const profileRequests = members.map(m =>
          this.authService.getUserById(m.userId)
        );
        forkJoin(profileRequests).subscribe({
          next: profiles => {
            this.members = members.map((m, i) => ({
              ...m,
              profile: {
                fullName: profiles[i]?.fullName ?? `User #${m.userId}`,
                email:    profiles[i]?.email ?? '',
                avatarUrl: (profiles[i] as any)?.avatarUrl
              }
            }));
            this.loadingMembers = false;
          },
          error: () => {
            // Profiles failed — show with raw IDs
            this.members = members;
            this.loadingMembers = false;
          }
        });
      },
      error: () => { this.loadingMembers = false; }
    });
  }

  onEmailInput(event: Event): void {
    this.emailQuery = (event.target as HTMLInputElement).value.trim();
    this.emailSearch$.next(this.emailQuery);
  }

  clearSearch(): void { this.emailQuery = ''; this.foundUser = null; this.searchError = ''; }

  addMember(): void {
    if (!this.foundUser || !this.workspace) return;
    const alreadyIn = this.members.some(m => m.userId === this.foundUser!.id);
    if (alreadyIn) { this.snack.open('This user is already a member.', 'Close', { duration: 3000 }); return; }
    this.addingMember = true;
    this.workspaceService.addMember(this.workspace.id, this.foundUser.id, this.selectedRole).subscribe({
      next: r => {
        this.snack.open(`${this.foundUser!.fullName} added as ${r.role}`, 'Close', { duration: 3000 });
        this.clearSearch(); this.addingMember = false; this.loadMembers();
      },
      error: err => { this.addingMember = false; this.snack.open(err.error?.message ?? 'Failed to add member', 'Close', { duration: 4000 }); }
    });
  }

  openMemberDetail(userId: number): void { this.router.navigate(['/workspace', this.workspace!.id, 'member', userId]); }

  tryCreateBoard(): void {
    if (!this.isPremium && this.boards.length >= this.freeBoardLimit) {
      this.snack.open('Free users can create up to 2 boards. Upgrade for unlimited boards.', 'Close', { duration: 3000 });
      this.dialog.open(UpgradePromptComponent, { width: '400px' });
      return; 
    }
    if (this.workspace?.visibility === 'PRIVATE') {
      this.boardForm.patchValue({ visibility: 'PRIVATE' });
    }
    this.showCreateBoard = !this.showCreateBoard;
  }

  createBoard(): void {
    if (this.boardForm.invalid) return;
    this.creatingBoard = true;
    
    const payload = {
      workspaceId: this.workspace!.id,
      ...this.boardForm.value,
      visibility: this.workspace!.visibility === 'PUBLIC'
        ? this.boardForm.value.visibility
        : 'PRIVATE'
    } as any;
    if (!payload.dueDate) {
      delete payload.dueDate;
    } else if (payload.dueDate.length === 16) {
      // Append seconds if missing (e.g. 2024-05-02T15:30 -> 2024-05-02T15:30:00)
      payload.dueDate = payload.dueDate + ':00';
    }
    if (!payload.priority) {
      delete payload.priority;
    }

    this.boardService.create(payload).subscribe({
      next: board => { this.boards.unshift(board); this.creatingBoard = false; this.showCreateBoard = false; this.boardForm.reset({ background: '#4f46e5', visibility: 'PRIVATE', dueDate: '', priority: '' }); this.snack.open('Board created!', 'Close', { duration: 3000 }); },
      error: err => {
        const message = err.error?.message ?? 'Create failed';
        this.creatingBoard = false;
        this.snack.open(message, 'Close', { duration: 4000 });
        if (message.toLowerCase().includes('free users')) {
          this.dialog.open(UpgradePromptComponent, { width: '400px' });
        }
      }
    });
  }

  openBoard(id: number): void {
    this.router.navigate(['/board', id]);
  }

  deleteBoard(id: number, e: Event): void {
    e.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data: { title: 'Delete Board', message: 'Permanently delete this board?', confirmText: 'Delete Board' } })
      .afterClosed().subscribe(ok => { if (!ok) return; this.boardService.delete(id).subscribe({ next: () => { this.boards = this.boards.filter(b => b.id !== id); this.snack.open('Board deleted', 'Close', { duration: 3000 }); } }); });
  }

  updateBoardColor(board: Board, color: string | null): void {
    if (!color) return;
    this.boardService.update(board.id, { name: board.name, description: board.description || undefined, background: color, visibility: board.visibility }).subscribe({ next: u => { board.background = u.background; } });
  }

  updateVisibility(visibility: 'PUBLIC' | 'PRIVATE'): void {
    if (!this.workspace || !this.isOwner()) return;
    this.workspaceService.update(this.workspace.id, { name: this.workspace.name, visibility }).subscribe({ next: ws => { this.workspace = ws; this.snack.open(`Workspace is now ${visibility}`, 'Close', { duration: 3000 }); } });
  }

  deleteWorkspace(): void {
    if (!this.workspace || (!this.isOwner() && !this.isAdmin())) return;
    this.dialog.open(ConfirmDialogComponent, { width: '400px', data: { title: 'Delete Workspace', message: 'This permanently deletes the workspace. Cannot be undone.', confirmText: 'Delete Forever' } })
      .afterClosed().subscribe(ok => { if (!ok) return; this.workspaceService.delete(this.workspace!.id).subscribe({ next: () => { this.snack.open('Workspace deleted', 'Close', { duration: 3000 }); this.router.navigate(['/dashboard']); } }); });
  }

  isOwner(): boolean { return this.workspace?.ownerId === this.userId; }
  isAdmin(): boolean { 
    const me = this.members.find(m => m.userId === this.userId);
    return me?.role === 'ADMIN'; 
  }
  isOverdue(board: Board): boolean {
    if (!board.dueDate || board.isClosed) return false;
    return new Date(board.dueDate) < new Date();
  }
  get memberCount(): number { return this.members.length || (this.workspace?.members?.length ?? 0); }
  getInitials(name: string): string { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
  getAvatarBg(seed: number): string { const c = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#14B8A6']; return c[seed % c.length]; }
  memberRole(m: WorkspaceMemberResult): string { if (m.userId === this.workspace?.ownerId) return 'OWNER'; return m.role; }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}
