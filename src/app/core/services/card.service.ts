import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  Card,
  CardAttachment,
  CardActivity,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  Priority,
  CardStatus
} from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardService {

  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/cards`;

  getByList(listId: number): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/list/${listId}`
    );
  }

  getByBoard(boardId: number): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}`
    );
  }

  getById(id: number): Observable<Card> {
    return this.http.get<Card>(`${this.base}/${id}`);
  }

  getByAssignee(userId: number): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/assignee/${userId}`
    );
  }

  create(data: CreateCardRequest): Observable<Card> {
    return this.http.post<Card>(this.base, data);
  }

  update(id: number, data: UpdateCardRequest): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}`,
      data
    );
  }

  delete(id: number): Observable<string> {
    return this.http.delete(
      `${this.base}/${id}`,
      { responseType: 'text' }
    );
  }

  move(id: number, data: MoveCardRequest): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/move`,
      data
    );
  }

  reorder(
    listId: number,
    orderedCardIds: number[]
  ): Observable<Card[]> {
    return this.http.put<Card[]>(
      `${this.base}/reorder`,
      { listId, orderedCardIds }
    );
  }

  archive(id: number): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/archive`,
      {}
    );
  }

  unarchive(id: number): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/unarchive`,
      {}
    );
  }

  setAssignee(
    id: number,
    assigneeId: number | null
  ): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/assignee`,
      { assigneeId }
    );
  }

  setPriority(id: number, priority: Priority): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/priority`,
      { priority }
    );
  }

  setStatus(id: number, status: CardStatus): Observable<Card> {
    return this.http.put<Card>(
      `${this.base}/${id}/status`,
      { status }
    );
  }

  getByStatus(
    boardId: number,
    status: CardStatus
  ): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}/status/${status}`
    );
  }

  getByPriority(
    boardId: number,
    priority: Priority
  ): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}/priority/${priority}`
    );
  }

  getOverdue(boardId: number): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}/overdue`
    );
  }

  getAllOverdue(): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/overdue/all`
    );
  }

  search(
    boardId: number,
    keyword: string
  ): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}/search?keyword=${keyword}`
    );
  }

  getArchivedByBoard(boardId: number): Observable<Card[]> {
    return this.http.get<Card[]>(
      `${this.base}/board/${boardId}/archived`
    );
  }

  getActivity(cardId: number): Observable<CardActivity[]> {
    return this.http.get<CardActivity[]>(
      `${this.base}/${cardId}/activity`
    );
  }

  uploadAttachment(cardId: number, file: File): Observable<CardAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CardAttachment>(
      `${this.base}/${cardId}/attachments`,
      formData
    );
  }

  getAttachments(cardId: number): Observable<CardAttachment[]> {
    return this.http.get<CardAttachment[]>(
      `${this.base}/${cardId}/attachments`
    );
  }

  deleteAttachment(cardId: number, attachmentId: number): Observable<string> {
    return this.http.delete(
      `${this.base}/${cardId}/attachments/${attachmentId}`,
      { responseType: 'text' }
    );
  }

  // Extra utilities
  getBoardStats(boardId: number): Observable<any> {
    return this.http.get(
      `${this.base}/board/${boardId}/stats`
    );
  }

  copyCard(
    id: number,
    targetListId?: number
  ): Observable<Card> {
    const params = targetListId
      ? `?targetListId=${targetListId}`
      : '';

    return this.http.post<Card>(
      `${this.base}/${id}/copy${params}`,
      {}
    );
  }

  getActivityPaged(
    cardId: number,
    page: number = 0,
    size: number = 20
  ): Observable<any> {
    return this.http.get(
      `${this.base}/${cardId}/activity/paged?page=${page}&size=${size}`
    );
  }

  globalSearch(
    keyword?: string,
    assigneeId?: number
  ): Observable<Card[]> {

    let params = '';

    if (keyword) {
      params += `keyword=${keyword}&`;
    }

    if (assigneeId) {
      params += `assigneeId=${assigneeId}`;
    }

    return this.http.get<Card[]>(
      `${this.base}/search?${params}`
    );
  }
}
