import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CardService } from '../../../core/services/card.service';
import { AuthService } from '../../../core/services/auth.service';
import { Card } from '../../../core/models/card.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  cards: Card[];
  holidays: any[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="app-canvas p-10 max-w-7xl mx-auto h-full overflow-y-auto">
      <div class="flex justify-between items-center mb-8">
         <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">{{ currentMonthName }} {{ currentYear }}</h1>
         <div class="flex gap-2">
            <button (click)="goToToday()" class="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Today</button>
            <div class="flex">
               <button (click)="prevMonth()" class="bg-white border border-slate-200 px-3 py-2 rounded-l-lg text-slate-600 hover:bg-slate-50 transition-colors border-r-0 cursor-pointer"><mat-icon>chevron_left</mat-icon></button>
               <button (click)="nextMonth()" class="bg-white border border-slate-200 px-3 py-2 rounded-r-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"><mat-icon>chevron_right</mat-icon></button>
            </div>
         </div>
      </div>
      
      <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[700px]">
         <!-- Calendar Header (Days) -->
         <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            <div class="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400" *ngFor="let day of weekdays">{{ day }}</div>
         </div>
         <!-- Calendar Grid -->
         <div class="flex-1 grid grid-cols-7 auto-rows-fr">
            <div *ngFor="let day of calendarDays; let i = index" 
                 class="border-b border-r border-slate-100 p-2 min-h-[120px] relative hover:bg-slate-50 transition-colors"
                 [class.border-r-0]="i % 7 === 6"
                 [class.opacity-50]="!day.isCurrentMonth">
               
               <!-- Date Number -->
               <span class="text-sm font-bold block mb-2" 
                     [class.bg-indigo-600]="day.isToday"
                     [class.text-white]="day.isToday"
                     [class.w-7]="day.isToday" [class.h-7]="day.isToday" [class.rounded-full]="day.isToday" [class.flex]="day.isToday" [class.items-center]="day.isToday" [class.justify-center]="day.isToday"
                     [class.text-slate-400]="!day.isCurrentMonth && !day.isToday"
                     [class.text-slate-700]="day.isCurrentMonth && !day.isToday">
                  {{ day.dayNumber }}
               </span>
               
               <!-- Loading State -->
               <div *ngIf="loading && day.isCurrentMonth && i % 3 === 0" class="mt-1 bg-slate-100 h-6 w-full rounded animate-pulse"></div>

               <!-- Holidays -->
               <div *ngFor="let h of day.holidays" class="mt-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded truncate border border-rose-200 shadow-sm cursor-help" [title]="h.name">
                  🎉 {{ h.name }}
               </div>

               <!-- Tasks -->
               <div *ngFor="let c of day.cards" class="mt-1 text-xs font-bold px-2 py-1 rounded truncate border shadow-sm cursor-pointer hover:opacity-80"
                    [ngClass]="{
                       'bg-emerald-100 text-emerald-700 border-emerald-200': c.status === 'DONE',
                       'bg-blue-100 text-blue-700 border-blue-200': c.status !== 'DONE'
                    }" [title]="c.title">
                  {{ c.status === 'DONE' ? '✓' : '•' }} {{ c.title }}
               </div>

            </div>
         </div>
      </div>
    </div>
  `
})
export class CalendarViewComponent implements OnInit {
  private http = inject(HttpClient);
  private cardService = inject(CardService);
  private authService = inject(AuthService);

  currentDate = new Date();
  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];
  
  holidays: any[] = [];
  userCards: Card[] = [];
  loading = true;

  get currentMonthName(): string {
    return this.currentDate.toLocaleString('default', { month: 'long' });
  }

  get currentYear(): number {
    return this.currentDate.getFullYear();
  }

  ngOnInit() {
    this.goToToday();
  }

  goToToday() {
    this.currentDate = new Date();
    this.refreshView();
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.refreshView();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.refreshView();
  }

  private refreshView() {
    this.generateCalendar();
    this.fetchDataForCurrentMonth();
  }

  private generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // First day of active month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0-6 (Sun-Sat)
    
    // Last day of active month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Previous month info
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    this.calendarDays = [];

    // Fill previous month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push(this.createDayObject(prevDate, false));
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
      const currDate = new Date(year, month, i);
      this.calendarDays.push(this.createDayObject(currDate, true));
    }

    // Fill next month leading days to complete grid (up to 35 or 42 based on needs)
    const requiredCells = this.calendarDays.length > 35 ? 42 : 35;
    let nextMonthDayCounter = 1;
    while (this.calendarDays.length < requiredCells) {
      const nextDate = new Date(year, month + 1, nextMonthDayCounter++);
      this.calendarDays.push(this.createDayObject(nextDate, false));
    }

    this.mapDataToGrid();
  }

  private createDayObject(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
    
    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      cards: [],
      holidays: []
    };
  }

  private fetchDataForCurrentMonth() {
    this.loading = true;
    const year = this.currentDate.getFullYear();
    
    const holidayRequest = this.http.get<any[]>(`https://date.nager.at/api/v3/PublicHolidays/${year}/US`);
    const cardRequest = this.cardService.getByAssignee(this.authService.getUserId());

    holidayRequest.subscribe({
      next: (data) => {
        this.holidays = data;
        this.mapDataToGrid();
      },
      error: () => console.warn('Could not load public holidays.')
    });

    cardRequest.subscribe({
      next: (cards) => {
        this.userCards = cards;
        this.mapDataToGrid();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private mapDataToGrid() {
    // Distribute holidays and cards to specific days
    this.calendarDays.forEach(day => {
      day.holidays = [];
      day.cards = [];
      
      const targetDateStr = day.date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Process holidays
      if (this.holidays.length > 0) {
         day.holidays = this.holidays.filter(h => h.date === targetDateStr);
      }

      // Process cards
      if (this.userCards.length > 0) {
         day.cards = this.userCards.filter(c => {
           if (!c.dueDate) return false;
           // c.dueDate from API is often string or Date. Normalize it.
           const cardDateStr = new Date(c.dueDate).toISOString().split('T')[0];
           return cardDateStr === targetDateStr;
         });
      }
    });
  }
}
