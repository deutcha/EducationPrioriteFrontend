import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserSaveRequest } from '../../model/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api`;

  
  getAllUsers(email?: string): Observable<User[]> {
    let params = new HttpParams();
    if (email) params = params.set('email', email);
    return this.http.get<User[]>(`${this.API_URL}/users`, { params });
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${userId}`);
  }

 
  updateUser(userId: string, userData: Partial<UserSaveRequest>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/users/${userId}`, userData);
  }

 
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/users/${userId}`);
  }

  
}