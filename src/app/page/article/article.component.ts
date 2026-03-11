import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; 
import { ArticleDto, ArticleSaveDto, ArticleSectionDto  } from '../../model/model'; 
import { StatutArticle } from '../../model/enum';
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
  selector: 'app-article',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, ToastModule, 
    ConfirmDialogModule, SelectButtonModule, DialogModule,
    InputTextModule, TextareaModule, DropdownModule, DatePickerModule,
     HasRoleDirective, PaginatorModule, ProgressSpinner
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss']
})
export class ArticleComponent implements OnInit, OnDestroy {
  private service = inject(JournalManagerService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private subs = new Subscription();
  private router = inject(Router);
  private searchTimeout: any;

  sectionsMap: { [articleId: number]: ArticleSectionDto[] } = {};
  loadingSections: { [articleId: number]: boolean } = {};
  sectionDialogVisible: boolean = false;
  currentArticleForSection: ArticleDto | null = null;
  editingSection: ArticleSectionDto | null = null;
  sectionForm: ArticleSectionDto = { contenu: '', ordre: 0 };
  sectionImageFile: File | null = null;
  sectionImagePreview: string | null = null;
  loadingSectionBtn: boolean = false;

  loading: boolean = true;
  loadingBtn: boolean = false;
  currentPage = 0;
  pageSize = 9;
  totalElements = 0;
  totalPages = 0;


  rubriqueId!: number;
  rubriqueNom!: string;

  articles: ArticleDto[] = [];
  searchTerm: string = '';
  
  articleDialog: boolean = false;
  submitted: boolean = false;
  selectedId: number | null = null;
  article: ArticleSaveDto = this.resetForm();
  
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  imageUrls: { [key: number]: string } = {};

  displayDetails: boolean = false;
  selectedArticle: ArticleDto | null = null;

  selectedStatut: string = 'PUBLIE'; 
  selectedDateDebut: Date | null = null;
  selectedDateFin: Date | null = null;

 statutOptions = [
  { label: 'Tout', value: 'TOUT' },
  { label: 'Publiés', value: 'PUBLIE' },
  { label: 'Brouillons', value: 'BROUILLON' }
];

  statutDropdown = [
    { label: 'Publié', value: StatutArticle.PUBLIE },
    { label: 'Brouillon', value: StatutArticle.BROUILLON }
  ];

  ngOnInit() {
    this.subs.add(
      this.route.params.subscribe(params => {
        this.rubriqueId = +params['rubriqueId'];
        this.rubriqueNom = params['rubriqueNom'];
        this.loadArticles();
      })
    );
  }

  resetForm(): ArticleSaveDto {
    return { titre: '', contenu: '', statut: StatutArticle.BROUILLON, rubriqueId: this.rubriqueId };
  }

 loadArticles() {
    this.loading = true;
    this.subs.add(
      this.service.getArticles(
        undefined,
        this.rubriqueId,
        this.searchTerm,          
        this.selectedStatut !== 'TOUT' ? this.selectedStatut : undefined,
        this.selectedDateDebut ?? undefined,
        this.selectedDateFin ?? undefined,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (data) => {
          this.articles = data.content;
          this.totalElements = data.totalElements;
          this.totalPages = data.totalPages;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du chargement' });
        }
      })
    );
  }

 onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 0;
      this.loadArticles();
    }, 400); 
  }


  onFilterChange() {
    this.currentPage = 0;
    this.loadArticles();
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.loadArticles();
  }

  openNew() {
    this.article = this.resetForm();
    this.article.rubriqueId = this.rubriqueId;
    this.selectedId = null;
    this.selectedFile = null;
    this.imagePreview = null;
    this.submitted = false;
    this.articleDialog = true;
  }

  
  showDetails(article: ArticleDto) {
    this.selectedArticle = article;
    this.displayDetails = true;
    this.loadSections(article);
    
  }

  editArticle(item: ArticleDto) {
    this.selectedId = item.id;
    this.article = {
      titre: item.titre,
      contenu: item.contenu,
      statut: item.statut,
      rubriqueId: item.rubriqueId
    };
    this.imagePreview = item.image ?  item.image : null;
    this.submitted = false;
    this.articleDialog = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveArticle() {
    this.submitted = true;

    if (!this.article.titre || !this.article.contenu || !this.article.statut) {
      return;
    }
    this.loadingBtn = true;
    this.subs.add(
      this.service.saveArticle(this.selectedId, this.article, this.selectedFile || undefined).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Article enregistré' });
          this.loadArticles();
          this.articleDialog = false;
          this.loadingBtn = false;
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur serveur' })
      })
    );
  }

  deleteArticle(article: ArticleDto) {
    this.confirmationService.confirm({
      message: 'Voulez-vous vraiment supprimer cet article ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(
          this.service.deleteArticle(article.id).subscribe({
            next: () => {
              this.loadArticles();
              this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Article supprimé' });
            }
          })
        );
      }
    });
  } 

goBack(): void { 
  this.router.navigate(['/child/rubrique']);
}

saveAsDraft(): void {
  this.article.statut = StatutArticle.BROUILLON;
  this.saveArticle();
}

  loadSections(article: ArticleDto) {
    if (this.sectionsMap[article.id]) return; 
    this.loadingSections[article.id] = true;
    this.subs.add(
      this.service.getSectionsByArticle(article.id).subscribe({
        next: (sections) => {
          this.sectionsMap[article.id] = sections;
          this.loadingSections[article.id] = false;
        },
        error: () => { this.loadingSections[article.id] = false; }
      })
    );
  }

  openSectionDialog(article: ArticleDto, section?: ArticleSectionDto) {
    this.currentArticleForSection = article;
    this.sectionImageFile = null;
    this.sectionImagePreview = null;
    if (section) {
      this.editingSection = section;
      this.sectionForm = { ...section };
      this.sectionImagePreview = section.image || null;
    } else {
      this.editingSection = null;
      this.sectionForm = { contenu: '', ordre: (this.sectionsMap[article.id]?.length || 0) };
    }
    this.sectionDialogVisible = true;
  }

  onSectionFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.sectionImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.sectionImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveSection() {
    if (!this.sectionForm.contenu || !this.currentArticleForSection) return;
    this.loadingSectionBtn = true;
    this.subs.add(
      this.service.saveSection(
        this.currentArticleForSection.id,
        this.sectionForm,
        this.sectionImageFile || undefined
      ).subscribe({
        next: (saved) => {
          const articleId = this.currentArticleForSection!.id;
          if (!this.sectionsMap[articleId]) this.sectionsMap[articleId] = [];
          if (this.editingSection) {
            const idx = this.sectionsMap[articleId].findIndex(s => s.id === saved.id);
            if (idx !== -1) this.sectionsMap[articleId][idx] = saved;
          } else {
            this.sectionsMap[articleId].push(saved);
          }
          this.sectionDialogVisible = false;
          this.loadingSectionBtn = false;
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Section enregistrée' });
        },
        error: () => {
          this.loadingSectionBtn = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde' });
        }
      })
    );
  }

  deleteSection(article: ArticleDto, section: ArticleSectionDto) {
    this.confirmationService.confirm({
      message: 'Supprimer cette section ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(
          this.service.deleteSection(article.id, section.id!).subscribe({
            next: () => {
              this.sectionsMap[article.id] = this.sectionsMap[article.id].filter(s => s.id !== section.id);
              this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Section supprimée' });
            }
          })
        );
      }
    });
  }

  ngOnDestroy() { 
    this.subs.unsubscribe(); 
  Object.values(this.imageUrls).forEach(url => URL.revokeObjectURL(url));}
}