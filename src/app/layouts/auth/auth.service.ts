import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { catchError, map, Observable, of, Subscription, tap } from 'rxjs';
import { LoginRequest, User, UserMap, UserSaveRequest } from '../../model/user';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  sub: string;      
  userId: string;   
  role: string;     
  email: string;    
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private BASE_URL = environment.API_URL;
  private router = inject(Router);
  user = signal<UserMap | User | null | undefined>(undefined);
  user2 = signal<User | null | undefined>(undefined);

   restoreUserFromToken(token: string): UserMap | null {
    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        this.logout();
        return null;
      }

      return {
        success: true,
        message: '',
        username: decoded.sub,
        role: decoded.role,
        id: decoded.userId
      };

    } catch {
      this.logout();
      return null;
    }
  }

  login(credentials : LoginRequest) : Observable<UserMap | null | undefined>{
     return this.http.post(this.BASE_URL + '/api/auth/login', credentials).pipe(
      tap((result : any) => {
        localStorage.setItem('token', result['token']);
        const token = localStorage.getItem('token');

        if(token) {
           const user : UserMap | null = this.restoreUserFromToken(token);
           this.user.set(user);
        }else{
          this.logout();
        }
        
      }),
      map((result : any) => {
        return {
          success : result['success'],
          message : result['message'],
          username : result['username'],
          role : result['role'],
          id : result['userId']
        };
      })
     )
  }

  
  register(credentials : UserSaveRequest) : Observable<User | null | undefined>{
     return this.http.post(this.BASE_URL + '/api/auth/register', credentials).pipe(
      tap((result : any) => {
        this.user2.set(result);
      }),
      map((result : any) => {
        return result;
      })
     )
  }

  
  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    
   
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    localStorage.removeItem('token');
     this.user.set(null);
     this.router.navigate(['/login']);
    return this.http.post(
      this.BASE_URL + '/api/auth/logout', 
      {}, 
      { headers }
    )
  }

  isauthenticate(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  get role(): string | null | undefined {
    return (this.user() as UserMap)?.role;
  }

  hasRole(...roles: string[]): boolean {
    return roles.includes(this.role ?? '');
  }

}


