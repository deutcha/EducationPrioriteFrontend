import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { ProfileComponent } from '../../profil/profil.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, DialogModule, ProfileComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  
  
  mobileMenuOpen = false;
  private subs: Subscription | null = null;
  private authService = inject(AuthService);

  displayModal: boolean = false;
  displayModalEdit: boolean = false;
  selectedUserId: string | null = null;
  username: string = 'Doe';
  items = [
        { label: 'ACCUEIL', routerLink: '/child/dasboard' },
        { label: 'RUBRIQUES', routerLink: '/child/rubrique' },
        { label: 'ARTICLES', routerLink: '/child/article' },
        { label: 'JOURNAL PDF', routerLink: '/child/journal' },
        { label: 'CONTACT', routerLink: '/child/contact' }
  ];

  ngOnInit(): void {

     if (this.authService.user()) {
      this.username = this.authService.user()?.username || 'Doe';
     }
     
    if (this.authService.hasRole('ADMIN', 'SUPER_ADMIN')) {
       this.items = [
        { label: 'ACCUEIL', routerLink: '/child/dasboard' },
        { label: 'RUBRIQUES', routerLink: '/child/rubrique' },
        { label: 'ARTICLES', routerLink: '/child/article' },
        { label: 'JOURNAL PDF', routerLink: '/child/journal' },
        { label: 'UTILISATEUR', routerLink: '/child/utilisateur' },
        { label: 'CONTACT', routerLink: '/child/contact' }
      ];
    }
    
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  getInitials(): string {
    if (!this.username) return '?';
    const parts = this.username.split(/[\s.\-_]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.username.substring(0, 2).toUpperCase();
  }

  getAvatarColor(): string {
    const colors = [
      'linear-gradient(135deg, #e8354a, #f87187)',
      'linear-gradient(135deg, #6366f1, #818cf8)',
      'linear-gradient(135deg, #0ea5e9, #38bdf8)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #8b5cf6, #a78bfa)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
    ];
    if (!this.username) return colors[0];
    let hash = 0;
    for (let i = 0; i < this.username.length; i++) {
      hash = this.username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
 }

  onLogout(): void {
    this.subs = this.authService.logout().subscribe({
      next: () => console.log('Déconnecté'),
      error: (err) => console.error(err)
    });
  }

  get isAuthenticated(): boolean {
   return this.authService.isauthenticate();
  }

  ngOnDestroy(): void {
    this.subs?.unsubscribe();
  }
}