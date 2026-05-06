import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardService } from '../../../core/services/card.service';
import { Card } from '../../../core/models/card.model';

@Component({
  selector: 'app-card-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './card-create.component.html',
  styleUrl: './card-create.component.css'
})
export class CardCreateComponent {

  @Input() listId!:  number;
  @Input() boardId!: number;
  @Output() cardCreated = new EventEmitter<Card>();
  @Output() createFailed = new EventEmitter<string>();
  @Output() cancelled   = new EventEmitter<void>();

  private fb          = inject(FormBuilder);
  private cardService = inject(CardService);

  loading = false;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1)]]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    this.cardService.create({
      listId:  this.listId,
      boardId: this.boardId,
      title:   this.form.value.title!
    }).subscribe({
      next: card => {
        this.loading = false;
        this.cardCreated.emit(card);
        this.form.reset();
      },
      error: error => {
        this.loading = false;
        this.createFailed.emit(error.error?.message || 'Failed to create card');
      }
    });
  }

  cancel(): void { this.cancelled.emit(); }
}
