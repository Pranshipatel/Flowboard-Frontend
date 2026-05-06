import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceMemberResult
} from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {

  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/workspaces`;

  private pinnedUpdatedSubject = new BehaviorSubject<void>(undefined);
  public pinnedUpdated$ = this.pinnedUpdatedSubject.asObservable();

  private archivedUpdatedSubject = new BehaviorSubject<void>(undefined);
  public archivedUpdated$ = this.archivedUpdatedSubject.asObservable();

  // ─── Pinned Workspaces ─────────────────────────────────────────────────────

  getPinnedWorkspaceIds(userId: number): number[] {
    const raw = localStorage.getItem(`pinned_ws_${userId}`);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { return []; }
    }
    return [];
  }

  togglePinWorkspace(userId: number, workspaceId: number): void {
    let pinned = this.getPinnedWorkspaceIds(userId);
    if (pinned.includes(workspaceId)) {
      pinned = pinned.filter(id => id !== workspaceId);
    } else {
      pinned.push(workspaceId);
    }
    localStorage.setItem(`pinned_ws_${userId}`, JSON.stringify(pinned));
    this.pinnedUpdatedSubject.next();
  }

  isWorkspacePinned(userId: number, workspaceId: number): boolean {
    return this.getPinnedWorkspaceIds(userId).includes(workspaceId);
  }

  // ─── Archived Workspaces ───────────────────────────────────────────────────

  getArchivedWorkspaceIds(userId: number): number[] {
    const raw = localStorage.getItem(`archived_ws_${userId}`);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { return []; }
    }
    return [];
  }

  toggleArchiveWorkspace(userId: number, workspaceId: number): void {
    let archived = this.getArchivedWorkspaceIds(userId);
    if (archived.includes(workspaceId)) {
      archived = archived.filter(id => id !== workspaceId);
    } else {
      archived.push(workspaceId);
      // Unpin if archiving
      let pinned = this.getPinnedWorkspaceIds(userId);
      if (pinned.includes(workspaceId)) {
        pinned = pinned.filter(id => id !== workspaceId);
        localStorage.setItem(`pinned_ws_${userId}`, JSON.stringify(pinned));
        this.pinnedUpdatedSubject.next();
      }
    }
    localStorage.setItem(`archived_ws_${userId}`, JSON.stringify(archived));
    this.archivedUpdatedSubject.next();
  }

  isWorkspaceArchived(userId: number, workspaceId: number): boolean {
    return this.getArchivedWorkspaceIds(userId).includes(workspaceId);
  }

  getByMember(userId: number): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/member/${userId}`);
  }

  getByOwner(userId: number): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/owner/${userId}`);
  }

  getPublic(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/public`);
  }

  getById(id: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/${id}`);
  }

  create(data: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<Workspace>(this.base, data);
  }

  update(id: number, data: UpdateWorkspaceRequest): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/${id}`, data);
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }

  // ─── Member management ─────────────────────────────────────────────────────

  /** Fetch all members of a workspace (returns clean DTO, not JPA entity) */
  getMembers(id: number): Observable<WorkspaceMemberResult[]> {
    return this.http.get<WorkspaceMemberResult[]>(`${this.base}/${id}/members`);
  }

  /**
   * Directly add a known user (by userId) to the workspace.
   * Requires the caller to be an ADMIN of the workspace.
   * Backend: POST /workspaces/{id}/members  { userId, role }
   */
  addMember(
    workspaceId: number,
    userId: number,
    role: 'ADMIN' | 'MEMBER'
  ): Observable<WorkspaceMemberResult> {
    return this.http.post<WorkspaceMemberResult>(
      `${this.base}/${workspaceId}/members`,
      { userId, role }
    );
  }

  /**
   * Remove a member from the workspace.
   * Backend: DELETE /workspaces/{workspaceId}/members/{memberId}
   */
  removeMember(workspaceId: number, memberId: number): Observable<string> {
    return this.http.delete(
      `${this.base}/${workspaceId}/members/${memberId}`,
      { responseType: 'text' }
    );
  }

  updateMemberRole(
    workspaceId: number,
    userId: number,
    role: string
  ): Observable<string> {
    return this.http.put(
      `${this.base}/${workspaceId}/members/${userId}/role`,
      { role },
      { responseType: 'text' }
    );
  }

  search(keyword: string): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/search?keyword=${keyword}`);
  }
}