import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Observable, Subject, of, forkJoin, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { CardService } from '../../core/services/card.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { BoardService } from '../../core/services/board.service';
import { ListService } from '../../core/services/list.service';
import { NotificationDropdownComponent } from '../../pages/dashboard/notification-dropdown/notification-dropdown.component';
import * as AuthSelectors from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import { UserProfile } from '../../core/models/user.model';
import { Workspace } from '../../core/models/workspace.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatTooltipModule, NotificationDropdownComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly authService    = inject(AuthService);
  private store           = inject(Store);
  private paymentService  = inject(PaymentService);
  private cardService     = inject(CardService);
  private workspaceService = inject(WorkspaceService);
  private boardService    = inject(BoardService);
  private listService     = inject(ListService);
  private router          = inject(Router);

  user$: Observable<UserProfile | null> = this.store.select(AuthSelectors.selectUser);
  isDarkMode = false;
  
  pinnedWorkspaces: Workspace[] = [];
  private pinnedSub?: Subscription;

  archivedWorkspaces: Workspace[] = [];
  showArchived = false;
  private archivedSub?: Subscription;

  // Search Implementation
  searchQuery = '';
  isSearchOpen = false;
  isSearching = false;
  searchSubject = new Subject<string>();
  
  filteredSearchResults: any[] = [];

  onSearchChange(val: string) {
    this.searchQuery = val;
    if (!val.trim()) {
       this.filteredSearchResults = [];
    } else {
       this.searchSubject.next(val);
    }
  }

  closeSearch() {
    setTimeout(() => { this.isSearchOpen = false; }, 200); // delay allows click to register
  }

  navigateToResult(route: string) {
    this.router.navigateByUrl(route);
    this.isSearchOpen = false;
    this.searchQuery = '';
  }

  planName = computed(() => {
    const p = this.paymentService.currentPlan();
    return p?.planDisplayName ?? 'Free';
  });

  isFreeUser = computed(() => {
    const p = this.paymentService.currentPlan();
    return !p || p.planName === 'FREE';
  });

  isAdmin = computed(() => {
    return localStorage.getItem('userRole') === 'PLATFORM_ADMIN';
  });

  ngOnInit() {
    this.store.dispatch(AuthActions.getProfile());
    const userId = this.authService.getUserId();
    this.paymentService.getSubscriptionStatus(userId).subscribe();
    this.isDarkMode = document.body.classList.contains('dark');
    
    this.loadPinnedWorkspaces();
    this.pinnedSub = this.workspaceService.pinnedUpdated$.subscribe(() => {
      this.loadPinnedWorkspaces();
    });

    this.loadArchivedWorkspaces();
    this.archivedSub = this.workspaceService.archivedUpdated$.subscribe(() => {
      this.loadArchivedWorkspaces();
    });
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) return of([]);
        this.isSearching = true;
        const url = this.router.url;

        if (url.includes('/board/')) {
          // Board Area -> search lists or cards
          const boardId = Number(url.split('/board/')[1].split('/')[0]);
          return forkJoin({
             lists: this.listService.getByBoard(boardId).pipe(catchError(() => of([]))),
             cards: this.cardService.getByBoard(boardId).pipe(catchError(() => of([])))
          }).pipe(
             map(res => {
                 const lists = res.lists.filter(l => l.name.toLowerCase().includes(query.toLowerCase()));
                 const cards = res.cards.filter(c => c.title.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()));
                 
                 const results: any[] = [];
                 lists.forEach(l => results.push({ type: 'List', name: l.name, icon: 'view_list', route: `/board/${boardId}` }));
                 cards.forEach(c => results.push({ type: 'Card', name: c.title, icon: 'task_alt', route: `/board/${boardId}?cardId=${c.id}` }));
                 return results;
             })
          );
        } else if (url.includes('/workspace/')) {
          // Workspace Area -> search boards
          const workspaceId = Number(url.split('/workspace/')[1].split('/')[0]);
          return this.boardService.getByWorkspace(workspaceId).pipe(
             catchError(() => of([])),
             map(boards => {
                 const filtered = boards.filter(b => b.name.toLowerCase().includes(query.toLowerCase()) || b.description?.toLowerCase().includes(query.toLowerCase()));
                 return filtered.map(b => ({ type: 'Board', name: b.name, icon: 'dashboard', route: `/board/${b.id}` }));
             })
          );
        } else {
          // Dashboard Area -> search workspaces
          const userId = this.authService.getUserId();
          if (!userId) return of([]);
          return this.workspaceService.getByMember(userId).pipe(
             catchError(() => of([])),
             map(workspaces => {
                 const filtered = workspaces.filter(w => w.name.toLowerCase().includes(query.toLowerCase()) || w.description?.toLowerCase().includes(query.toLowerCase()));
                 return filtered.map(w => ({ type: 'Workspace', name: w.name, icon: 'workspaces', route: `/workspace/${w.id}` }));
             })
          );
        }
      })
    ).subscribe(dynamicResults => {
      this.isSearching = false;
      this.filteredSearchResults = dynamicResults;
    });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  loadPinnedWorkspaces() {
    const userId = this.authService.getUserId();
    if (!userId) return;
    const pinnedIds = this.workspaceService.getPinnedWorkspaceIds(userId);
    if (pinnedIds.length === 0) {
      this.pinnedWorkspaces = [];
      return;
    }
    
    this.workspaceService.getByMember(userId).subscribe({
      next: (workspaces) => {
        this.pinnedWorkspaces = workspaces.filter(ws => pinnedIds.includes(ws.id));
      }
    });
  }

  loadArchivedWorkspaces() {
    const userId = this.authService.getUserId();
    if (!userId) return;
    const archivedIds = this.workspaceService.getArchivedWorkspaceIds(userId);
    if (archivedIds.length === 0) {
      this.archivedWorkspaces = [];
      return;
    }
    
    this.workspaceService.getByMember(userId).subscribe({
      next: (workspaces) => {
        this.archivedWorkspaces = workspaces.filter(ws => archivedIds.includes(ws.id));
      }
    });
  }

  toggleArchivedView() {
    this.showArchived = !this.showArchived;
  }

  unarchiveWorkspace(id: number, event: Event) {
    event.stopPropagation();
    const userId = this.authService.getUserId();
    if (!userId) return;
    this.workspaceService.toggleArchiveWorkspace(userId, id);
  }

  ngOnDestroy() {
    if (this.pinnedSub) this.pinnedSub.unsubscribe();
    if (this.archivedSub) this.archivedSub.unsubscribe();
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}