import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RubriqueDto, RubriqueSaveDto } from '../../model/model';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { JournalManagerService } from '../../layouts/services/journal-manager-service.service';
import { RouterModule } from '@angular/router';
import { HasRoleDirective } from '../../layouts/auth/has-role.directive';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-rubrique',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, DialogModule, 
    InputTextModule, TextareaModule, ToastModule, 
    ConfirmDialogModule, IconFieldModule, InputIconModule,
    RouterModule, HasRoleDirective, PaginatorModule, ProgressSpinner
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './rubrique.component.html',
  styleUrls: ['./rubrique.component.scss']
})
export class RubriqueComponent implements OnInit, OnDestroy {
  private service = inject(JournalManagerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private searchTimeout: any;

  private subs = new Subscription();

  loading: boolean = true;
  rubriques: RubriqueDto[] = [];
  searchTerm: string = '';
  
  rubriqueDialog: boolean = false;
  rubrique: RubriqueSaveDto = { nom: '', description: '' };
  selectedId: number | null = null;
  submitted: boolean = false;
  detailsDialog: boolean = false;
  selectedRubriqueForDetails: RubriqueDto | null = null;

  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;

  ngOnInit() {
    this.loadRubriques();
  }

  loadRubriques() {
    this.loading = true;
    this.subs.add(
      this.service.getRubriques(undefined, this.searchTerm, this.currentPage, this.pageSize).subscribe({
        next: (page) =>{
            this.rubriques = page.content;
            this.totalElements = page.totalElements;
            this.totalPages = page.totalPages;
            this.loading = false;
        },
        error: (err) => {
          console.log(err);
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement' })
        }
      })
    );
  }

  onPageChange(event: any) {
    this.loading = true;
    this.currentPage = event.page;
    this.loadRubriques();
  }

  onSearchChange() {
    this.loading = true;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadRubriques();
    }, 400); 
  }

  openNew() {
    this.rubrique = { nom: '', description: '' };
    this.selectedId = null;
    this.submitted = false;
    this.rubriqueDialog = true;
  }

  
  viewDetails(item: RubriqueDto) {
      this.selectedRubriqueForDetails = item;
      this.detailsDialog = true;
  }

  editRubrique(item: RubriqueDto) {
    this.rubrique = { nom: item.nom, description: item.description };
    this.selectedId = item.id;
    this.detailsDialog = false;
    this.rubriqueDialog = true;
  }

  deleteRubrique(item: RubriqueDto) {
    this.detailsDialog = false;
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer cette rubrique ?',
      header: 'Attention',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(
          this.service.deleteRubrique(item.id).subscribe({
            next: () => {
              this.loadRubriques();
              this.detailsDialog = false;
              this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Rubrique effacée' });
            }
          })
        );
      }
    });
  }

  saveRubrique() {
    this.submitted = true;
    if (this.rubrique.nom.trim()) {
      const request = this.selectedId 
        ? this.service.updateRubrique(this.selectedId, this.rubrique)
        : this.service.createRubrique(this.rubrique);

      this.subs.add(
        request.subscribe({
          next: () => {
            this.loadRubriques();
            this.rubriqueDialog = false;
            this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Enregistré avec succès' });
          }
        })
      );
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}