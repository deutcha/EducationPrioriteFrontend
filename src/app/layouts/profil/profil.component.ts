import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserMap } from '../../model/user';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { AuthService } from '../auth/auth.service';
import { DialogModule } from "primeng/dialog";
import { Subscription } from 'rxjs/internal/Subscription';
import { RegisterComponent } from "../auth/register/register/register.component";
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ConfirmDialogModule, ToastModule, ButtonModule, DialogModule, RegisterComponent, ProgressSpinner],
  providers: [ConfirmationService, MessageService],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private subs = new Subscription(); 
  currentUser: User | UserMap | null | undefined = null;

  displayModal: boolean = false;
  selectedUserId: string | null = null;

  user: User | null = null;

 ngOnInit(): void {
    this.currentUser = this.authService.user();
    if (this.currentUser?.id) {
      this.loadProfile(this.currentUser.id); 
    }
  }

 loadProfile(id: string) {
  this.subs.add(
    this.userService.getUserById(id).subscribe({ 
      next: (data) => {
        this.user = data;
      },
      error: () => this.messageService.add({ 
        severity: 'error', 
        summary: 'Erreur', 
        detail: 'Profil introuvable' 
      })
    })
  );
}

   refreshAfterSave() {
    this.displayModal = false; 
    if (this.currentUser?.id) {
      this.loadProfile(this.currentUser.id); 
    }          
  }

  edit() {
    this.displayModal = true;
    this.selectedUserId = this.user?.id || null;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(username: string): string {
  if (!username) return '?';
  const parts = username.split(/[\s.\-_]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.substring(0, 2).toUpperCase();
}

getAvatarColor(username: string): string {
  const colors = [
    'linear-gradient(135deg, #e8354a, #f87187)',
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
  ];
  if (!username) return colors[0];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

    ngOnDestroy(): void { 
      this.subs?.unsubscribe(); 
    }
}