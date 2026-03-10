import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserSaveRequest } from '../../model/user';
import { environment } from '../../../environments/environment';
import { Page } from '../../model/model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api`;

  
  getAllUsers(search?: string, dateDebut?: Date, dateFin?: Date, page: number = 0, size: number = 9): Observable<Page<User>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    if (dateDebut) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      params = params.set('dateDebut', debut.toISOString());
    }

    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      params = params.set('dateFin', fin.toISOString());
    }

    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    
    return this.http.get<Page<User>>(`${this.API_URL}/users`, { params });
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