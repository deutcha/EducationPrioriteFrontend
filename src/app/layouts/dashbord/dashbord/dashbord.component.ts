import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { JournalManagerService } from '../../services/journal-manager-service.service';
import { ArticleDto, JournalPdfDto } from '../../../model/model';
import { AuthService } from '../../auth/auth.service';
import { HasRoleDirective } from '../../auth/has-role.directive';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRoleDirective],
  templateUrl: './dashbord.component.html',
  styleUrls: ['./dashbord.component.scss']
})
export class DashboardComponent implements OnInit {

  private service = inject(JournalManagerService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  journals: JournalPdfDto[] = [];
  featuredArticles: ArticleDto[] = [];

  modules = [
    { title: 'Rubriques', icon: 'pi-th-large', color: 'bg-[#e11d48]', soft: 'bg-[#fff1f2]', text: 'text-[#e11d48]', num: '01', desc: 'Naviguez à travers nos grandes thématiques pédagogiques.', link: '/child/rubrique' },
    { title: 'Articles', icon: 'pi-pencil', isFeatured: true, num: '02', desc: 'Enquêtes exclusives et analyses signées par nos experts.', link: '/child/rubrique' },
    { title: 'Journaux PDF', icon: 'pi-file-pdf', color: 'bg-[#fb7185]', soft: 'bg-[#fff1f2]', text: 'text-[#fb7185]', num: '03', desc: 'Téléchargez nos éditions mensuelles complètes.', link: '/child/journal' },
    { title: 'Espace membres', icon: 'pi-users', color: 'bg-[#334155]', soft: 'bg-[#f1f5f9]', text: 'text-[#334155]', num: '04', desc: 'Gérez votre profil et rejoignez la communauté.', link: '/child/utilisateur' }
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
   
       journals: this.service.getJournals(undefined, 'ACTIF', undefined, undefined, undefined, 0, 3),

       articles: this.service.getArticles(undefined, undefined, undefined, 'PUBLIE', undefined, undefined, 0, 4)
    }).subscribe({
      next: (res) => {
         this.journals = res.journals.content;
         this.featuredArticles = res.articles.content;
      }
    });
  }

   private showToast(severity: string, summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
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

  get isAuthenticated(): boolean {
   return this.authService.isauthenticate();
  }

}