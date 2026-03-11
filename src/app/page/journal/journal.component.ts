import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalPdfDto, JournalPdfSaveDto } from '../../model/model';
import { StatutJournal } from '../../model/enum';
import { JournalManagerService } from '../../layouts/services/journal-manager-service.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { HasRoleDirective } from '../../layouts/auth/has-role.directive';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, ToastModule, 
    ConfirmDialogModule, SelectButtonModule, DialogModule,DatePickerModule,
    InputTextModule, TextareaModule, DropdownModule, HasRoleDirective, PaginatorModule, ProgressSpinner
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './journal.component.html',
  styleUrls: ['./journal.component.scss']
})
export class JournalComponent implements OnInit, OnDestroy {
  private service = inject(JournalManagerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private subs = new Subscription();
  private searchTimeout: any;

  loading: boolean = true;
  loadingBtn: boolean = false;
  currentPage = 0;
  pageSize = 12;
  totalElements = 0;
  totalPages = 0;

  journals: JournalPdfDto[] = [];
  searchTerm: string = '';
  imageUrls: { [key: number]: string } = {};

  displayJournalDetails: boolean = false;
    selectedJournal: JournalPdfDto | null = null;
    selectedStatut: string = StatutJournal.ACTIF; 
    selectedDateDebut: Date | null = null;
    selectedDateFin: Date | null = null;

  statutOptions = [
    { label: 'Tous', value: 'TOUT' },
    { label: 'Actifs', value: StatutJournal.ACTIF },
    { label: 'Inactifs', value: StatutJournal.INACTIF }
  ];

  statutDropdown = [
    { label: 'Actif', value: StatutJournal.ACTIF },
    { label: 'Inactif', value: StatutJournal.INACTIF }
  ];

  journalDialog: boolean = false;
  submitted: boolean = false;
  selectedId: number | null = null;
  journal: JournalPdfSaveDto = { titre: '', statut: StatutJournal.ACTIF, description: '' };
  
  pdfFile: File | null = null;
  coverFile: File | null = null;
  coverPreview: string | null = null;

  ngOnInit() {
    this.loadJournals();
  }

  loadJournals() {
    this.loading = true;
    const statutFilter = this.selectedStatut === 'TOUT' ? undefined : this.selectedStatut;

    this.subs.add(
      this.service.getJournals(
        undefined,
        statutFilter,
        this.searchTerm,
        this.selectedDateDebut ?? undefined,
        this.selectedDateFin ?? undefined,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (data) => {
          this.journals = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.loading = false;
          
        },
        error: () => {
          this.loading = false;
          this.showToast('error', 'Erreur', 'Impossible de charger les journaux');
        }
      })
    );
  }

  onSearchChange() {
    this.loading = true;
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadJournals();
    }, 400);
  }

  onFilterChange() {
    this.loading = true;
    this.currentPage = 0;
    this.loadJournals();
  }

  onPageChange(event: any) {
    this.loading = true;
    this.currentPage = event.page;
    this.loadJournals();
  }

  onFileChange(event: any, type: 'pdf' | 'cover') {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'pdf') {
      this.pdfFile = file;
    } else {
      this.coverFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.coverPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveJournal() {
    this.submitted = true;
    if (!this.journal.titre || (!this.selectedId && !this.pdfFile)) return;
    this.loadingBtn = true;
    this.subs.add(
      this.service.saveJournal(this.selectedId, this.journal, this.pdfFile || undefined, this.coverFile || undefined).subscribe({
        next: () => {
          this.showToast('success', 'Succès', 'Journal enregistré');
          this.journalDialog = false;
          this.loadJournals();
          this.resetUploads();
          this.loadingBtn = false;
        }
      })
    );
  }

  deleteJournal(id: number) {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer ce journal ?',
      header: 'Confirmation de suppression',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(this.service.deleteJournal(id).subscribe(() => {
          this.loadJournals();
          this.showToast('success', 'Supprimé', 'Le journal a été supprimé');
        }));
      }
    });
  }

   downloadPdf(fileUrl: string) {
      if (!fileUrl) {
        return;
      }

      this.service.downloadPdf(fileUrl).subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); 
        },
        error: (err) => {
          console.error('Erreur téléchargement:', err);
          this.showToast('error', 'Erreur', 'Impossible de télécharger le PDF');
        }
      });
    }

   openPdf(fileUrl: string) {
      if (!fileUrl) return;

      this.service.downloadPdf(fileUrl).subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 5000); 
        },
        error: (err) => {
          console.error('Erreur ouverture PDF:', err);
          this.showToast('error', 'Erreur', 'Impossible d\'ouvrir le PDF');
        }
      });
    }

  resetUploads() {
    this.pdfFile = null;
    this.coverFile = null;
    this.coverPreview = null;
    this.submitted = false;
  }

  openNew(){
    this.journal = {
      titre: '',
      statut: StatutJournal.ACTIF,
      description: undefined
    };

    this.resetUploads();
    this.selectedId = null;
    this.journalDialog = true;
  }

  editJournal(item: JournalPdfDto) {
    this.selectedId = item.id; 
    
    this.journal = {
      titre: item.titre,
      statut: item.statut,
      description: item.description
    };

    this.coverPreview = item.imageCouverture ?  item.imageCouverture : null;;
    
    this.pdfFile = null;
    this.coverFile = null;
    
    this.submitted = false;
    this.journalDialog = true;
  }

  private showToast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
  }

  showDetails(journal: JournalPdfDto) {
    this.selectedJournal = journal;
    this.displayJournalDetails = true;
  }

  goBack() {
    this.journalDialog = false; 
  }

  goBack2() {
    this.displayJournalDetails = false;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    Object.values(this.imageUrls).forEach(url => URL.revokeObjectURL(url));
  }
}