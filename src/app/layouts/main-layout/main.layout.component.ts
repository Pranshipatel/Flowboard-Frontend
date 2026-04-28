import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { CardService } from '../../core/services/card.service';
import { NotificationCenterComponent } from '../../pages/notification/notificaton-center/notificaton-center.component';
import * as AuthSelectors from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet, FormsModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatTooltipModule, NotificationCenterComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  readonly authService    = inject(AuthService);
  private store           = inject(Store);
  private paymentService  = inject(PaymentService);
  private cardService     = inject(CardService);
  private router          = inject(Router);

  user$: Observable<UserProfile | null> = this.store.select(AuthSelectors.selectUser);
  isDarkMode = false;

  // Search Implementation
  searchQuery = '';
  isSearchOpen = false;
  isSearching = false;
  searchSubject = new Subject<string>();
  
  mockSearchData = [
    { type: 'Context', name: 'Dashboard', icon: 'grid_view', route: '/dashboard' },
    { type: 'Context', name: 'Profile Settings', icon: 'settings', route: '/profile' },
    { type: 'Context', name: 'Calendar Overview', icon: 'calendar_month', route: '/calendar' }
  ];

  filteredSearchResults: any[] = [...this.mockSearchData];

  onSearchChange(val: string) {
    this.searchQuery = val;
    if (!val.trim()) {
       this.filteredSearchResults = [...this.mockSearchData];
    } else {
       this.searchSubject.next(val);
    }
  }

  closeSearch() {
    setTimeout(() => { this.isSearchOpen = false; }, 200); // delay allows click to register
  }

  navigateToResult(route: string) {
    this.router.navigate([route]);
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

  ngOnInit() {
    this.store.dispatch(AuthActions.getProfile());
    const userId = this.authService.getUserId();
    this.paymentService.getSubscriptionStatus(userId).subscribe();
    this.isDarkMode = document.body.classList.contains('dark');
    
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching = true;
        return this.cardService.globalSearch(query).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(cards => {
      this.isSearching = false;
      const dynamicResults = cards.map(c => ({
        type: 'Task Card',
        name: c.title,
        icon: 'task_alt',
        route: `/board/${c.boardId}`
      }));
      // Filter the local mock data
      const local = this.mockSearchData.filter(item => item.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
      this.filteredSearchResults = [...local, ...dynamicResults];
    });
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark', this.isDarkMode);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}