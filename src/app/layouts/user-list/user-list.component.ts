import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../model/user';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { RegisterComponent } from '../auth/register/register/register.component';
import { UserService } from '../services/user.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { DatePickerModule } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    DatePickerModule,
    RegisterComponent,
    PaginatorModule,
    ProgressSpinner
],

  providers: [MessageService, ConfirmationService],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private subs = new Subscription();
   private searchTimeout: any;
  protected readonly Math = Math;

  loading: boolean = true;
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  users: User[] = [];
  searchTerm: string = '';
  displayModal: boolean = false;
  selectedUserId: string | null = null;
  selectedDateDebut: Date | null = null;
  selectedDateFin: Date | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.subs.add(
     this.userService.getAllUsers(
        this.searchTerm,
        this.selectedDateDebut ?? undefined,
        this.selectedDateFin ?? undefined,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (data) => {
          this.users = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.loading = false;
          
        },
        error: (err) => {
          console.log(err);
          this.messageService.add({ 
          severity: 'error', 
          summary: 'Erreur', 
          detail: 'Impossible de charger les utilisateurs' 
        })
        }
      })
    );
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadUsers();
    }, 400);
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadUsers();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.loadUsers();
  }

  openCreate(): void {
    this.selectedUserId = null;
    this.displayModal = true;
  }

  deleteUser(userId: string): void {
    this.confirmationService.confirm({
      message: `Voulez-vous vraiment supprimer cet utilisateur ?`,
      header: 'Confirmation de suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(
          this.userService.deleteUser(userId).subscribe({
            next: () => {
              this.users = this.users.filter(u => u.id !== userId);
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Supprimé', 
                detail: 'Utilisateur retiré avec succès' 
              });
            },
            error: () => this.messageService.add({ 
              severity: 'error', 
              summary: 'Erreur', 
              detail: 'La suppression a échoué' 
            })
          })
        );
      }
    });
  }
  refreshAfterSave() {
    this.displayModal = false; 
    this.loadUsers();          
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

  getRoleBadgeClassTailwind(role: string): string {
    const r = (role || 'USER').toUpperCase();
    switch (r) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return 'bg-red-50 text-[#e8354a] border-[#fca5a5]';
      case 'SUPERVISEUR':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  }

  getRoleIcon(role: string): string {
    const r = (role || 'USER').toUpperCase();
    if (r === 'SUPERADMIN' || r === 'ADMIN') return 'pi-shield';
    if (r === 'SUPERVISEUR')                 return 'pi-eye';
    return 'pi-user';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}