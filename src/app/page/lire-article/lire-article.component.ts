import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ArticleDto, ArticleSaveDto, ArticleSectionDto } from '../../model/model';
import { StatutArticle } from '../../model/enum';
import { JournalManagerService } from '../../layouts/services/journal-manager-service.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription, forkJoin } from 'rxjs';
import { HasRoleDirective } from '../../layouts/auth/has-role.directive';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinner } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-lire-article',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HasRoleDirective,
    ToastModule, ConfirmDialogModule, ProgressSpinner,
    DialogModule, InputTextModule, TextareaModule, DropdownModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './lire-article.component.html',
  styleUrls: ['./lire-article.component.scss']
})
export class LireArticleComponent implements OnInit, OnDestroy {
  private service = inject(JournalManagerService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private subs = new Subscription();

  article: ArticleDto | null = null;
  sections: ArticleSectionDto[] = [];
  loading = true;
  loadingSections = false;

  // Recommandations
  articlesMemRubrique: ArticleDto[] = [];
  articlesRecents: ArticleDto[] = [];
  loadingReco = false;

  // Dialog section
  sectionDialogVisible = false;
  editingSection: ArticleSectionDto | null = null;
  sectionForm: ArticleSectionDto = {titre: '' ,contenu: '', ordre: 0 };
  sectionImageFile: File | null = null;
  sectionImagePreview: string | null = null;
  loadingSectionBtn = false;

  // Dialog modifier article
  articleDialogVisible = false;
  articleForm: ArticleSaveDto = { titre: '', contenu: '', statut: StatutArticle.BROUILLON, rubriqueId: 0 };
  articleImageFile: File | null = null;
  articleImagePreview: string | null = null;
  loadingArticleBtn = false;
  submitted = false;

  statutDropdown = [
    { label: 'Publié', value: StatutArticle.PUBLIE },
    { label: 'Brouillon', value: StatutArticle.BROUILLON }
  ];

  ngOnInit() {
    this.subs.add(
      this.route.params.subscribe(params => {
        const slug = params['slug'];
        if (slug) this.loadArticle(slug);
      })
    );
  }

  loadArticle(slug: string) {
    this.loading = true;
    this.subs.add(
      this.service.getArticleBySlug(slug).subscribe({
        next: (data) => {
          this.article = data;
          this.loading = false;
          this.loadSections();
          this.loadRecommandations();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Article introuvable' });
        }
      })
    );
  }

  loadSections() {
    if (!this.article) return;
    this.loadingSections = true;
    this.subs.add(
      this.service.getSectionsByArticle(this.article.id).subscribe({
        next: (data) => { this.sections = data; this.loadingSections = false; console.log(data) },
        error: () => { this.loadingSections = false; }
      })
    );
  }

  loadRecommandations() {
    if (!this.article) return;
    this.loadingReco = true;
    this.subs.add(
      forkJoin({
        aleatoires: this.service.getArticles(undefined, undefined, undefined, 'PUBLIE', undefined, undefined, Math.floor(Math.random() * 5), 8),
        recents: this.service.getArticles(undefined, undefined, undefined, 'PUBLIE', undefined, undefined, 0, 6)
      }).subscribe({
        next: (res) => {
          // Aléatoires : mélange côté client et exclut l'article courant
          this.articlesMemRubrique = res.aleatoires.content
            .filter(a => a.id !== this.article!.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

          // Récents : exclut l'article courant
          this.articlesRecents = res.recents.content
            .filter(a => a.id !== this.article!.id)
            .slice(0, 4);

          this.loadingReco = false;
        },
        error: () => { this.loadingReco = false; }
      })
    );
  }

  navigateToArticle(slug: string) {
    this.sections = [];
    this.articlesMemRubrique = [];
    this.articlesRecents = [];
    this.router.navigate(['/child/articles/lire', slug]);
  }

  // ── Article ──────────────────────────────────────────
  openEditArticleDialog() {
    if (!this.article) return;
    this.articleForm = {
      titre: this.article.titre,
      contenu: this.article.contenu,
      statut: this.article.statut,
      rubriqueId: this.article.rubriqueId
    };
    this.articleImagePreview = this.article.image || null;
    this.articleImageFile = null;
    this.submitted = false;
    this.articleDialogVisible = true;
  }

  onArticleFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.articleImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.articleImagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveArticle() {
    this.submitted = true;
    if (!this.articleForm.titre || !this.articleForm.contenu) return;
    this.loadingArticleBtn = true;
    this.subs.add(
      this.service.saveArticle(this.article!.id, this.articleForm, this.articleImageFile || undefined).subscribe({
        next: (updated) => {
          this.article = updated;
          this.articleDialogVisible = false;
          this.loadingArticleBtn = false;
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Article mis à jour' });
        },
        error: () => {
          this.loadingArticleBtn = false;
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour' });
        }
      })
    );
  }

  deleteArticle() {
    if (!this.article) return;
    this.confirmationService.confirm({
      message: 'Supprimer définitivement cet article ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.subs.add(
          this.service.deleteArticle(this.article!.id).subscribe({
            next: () => this.goBack()
          })
        );
      }
    });
  }

  // ── Sections ─────────────────────────────────────────
  openSectionDialog(section?: ArticleSectionDto) {
    this.sectionImageFile = null;
    this.sectionImagePreview = null;
    if (section) {
      this.editingSection = section;
      this.sectionForm = { ...section };
      this.sectionImagePreview = section.image || null;
    } else {
      this.editingSection = null;
      this.sectionForm = {titre: '' , contenu: '', ordre: this.sections.length };
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
    if (!this.sectionForm.contenu || !this.article) return;
    this.loadingSectionBtn = true;
    this.subs.add(
      this.service.saveSection(this.article.id, this.sectionForm, this.sectionImageFile || undefined).subscribe({
        next: (saved) => {
          if (this.editingSection) {
            const idx = this.sections.findIndex(s => s.id === saved.id);
            if (idx !== -1) this.sections[idx] = saved;
          } else {
            this.sections.push(saved);
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

  deleteSection(section: ArticleSectionDto) {
    this.confirmationService.confirm({
      message: 'Supprimer cette section ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      acceptButtonStyleClass: 'p-button-danger p-button-text',
      rejectLabel: 'Annuler',
      accept: () => {
        this.subs.add(
          this.service.deleteSection(this.article!.id, section.id!).subscribe({
            next: () => {
              this.sections = this.sections.filter(s => s.id !== section.id);
              this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Section supprimée' });
            }
          })
        );
      }
    });
  }

  goBack() {
    this.router.navigate(['/child/article']);
  }

  ngOnDestroy() { this.subs.unsubscribe(); }
}