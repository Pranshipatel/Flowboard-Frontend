import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6 max-w-sm w-full bg-white rounded-xl shadow-lg">
      <div class="flex items-start gap-4 mb-5">
        <div class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <mat-icon>warning_amber</mat-icon>
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800 mb-1" mat-dialog-title style="padding: 0; margin: 0; font-size: 18px;">{{ data.title }}</h2>
          <p class="text-sm text-slate-600 leading-relaxed">{{ data.message }}</p>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 mt-6">
        <button mat-button (click)="onCancel()" class="px-4 text-slate-600 font-semibold hover:bg-slate-50 transition-colors rounded-lg">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-flat-button color="warn" (click)="onConfirm()" class="px-4 font-bold shadow-sm">
          {{ data.confirmText || 'Delete' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
       border-radius: 16px !important;
       overflow: hidden;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
