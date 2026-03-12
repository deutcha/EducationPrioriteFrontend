import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserMap } from '../../model/user';

export const authGuard: CanActivateFn = (route, state) => {
 
  const loginService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
   if(token) {
    const user : UserMap | null = loginService.restoreUserFromToken(token);
    loginService.user.set(user);
  }else{
    router.navigate(['/login']);
    return false;
  }

  if (loginService.user() === undefined || loginService.user() === null || localStorage.getItem('token')?.includes('undefined')) {
    router.navigate(['/login']);
    return false;
  } 

  return true;
};
