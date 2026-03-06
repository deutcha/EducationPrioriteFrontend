import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  ArticleDto, ArticleSaveDto, 
  JournalPdfDto, JournalPdfSaveDto, 
  RubriqueDto, RubriqueSaveDto, 
  MessageContact 
} from '../../model/model'; 
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JournalManagerService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api/v1/journal-manager`;

  // --- ARTICLES ---

  getArticles(id?: number, rubriqueId?: number, slug?: string, statut?: string): Observable<ArticleDto[]> {
    let params = new HttpParams();
    if (id) params = params.set('id', id.toString());
    if (rubriqueId) params = params.set('rubriqueId', rubriqueId.toString());
    if (slug) params = params.set('slug', slug);
    if (statut) params = params.set('statut', statut);
    return this.http.get<ArticleDto[]>(`${this.API_URL}/articles`, { params });
  }

  getArticleBySlug(slug: string): Observable<ArticleDto> {
    return this.http.get<ArticleDto>(`${this.API_URL}/articles/${slug}`);
  }

  saveArticle(id: number | null, article: ArticleSaveDto, imageFile?: File): Observable<ArticleDto> {
    const formData = new FormData();
    formData.append('titre', article.titre);
    formData.append('contenu', article.contenu);
    formData.append('statut', article.statut);
    formData.append('rubriqueId', article.rubriqueId.toString());
    
    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (id === null) {
      return this.http.post<ArticleDto>(`${this.API_URL}/articles`, formData);
    } else {
      return this.http.patch<ArticleDto>(`${this.API_URL}/articles/${id}`, formData);
    }
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/articles/${id}`);
  }

  // --- JOURNAUX PDF ---

  getJournals(id?: number, statut?: string): Observable<JournalPdfDto[]> {
    let params = new HttpParams();
    if (id) params = params.set('id', id.toString());
    if (statut) params = params.set('statut', statut);
    return this.http.get<JournalPdfDto[]>(`${this.API_URL}/journal`, { params });
  }

  saveJournal(id: number | null, journal: JournalPdfSaveDto, pdfFile?: File, coverFile?: File): Observable<JournalPdfDto> {
    const formData = new FormData();
    formData.append('titre', journal.titre);
    formData.append('statut', journal.statut);
    if (journal.description) formData.append('description', journal.description);
    
    if (pdfFile) formData.append('pdfFile', pdfFile);
    if (coverFile) formData.append('coverFile', coverFile);

    if (id === null) {
      return this.http.post<JournalPdfDto>(`${this.API_URL}/journal`, formData);
    } else {
      return this.http.patch<JournalPdfDto>(`${this.API_URL}/journal/${id}`, formData);
    }
  }

  deleteJournal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/journal/${id}`);
  }

  // --- RUBRIQUES ---

  getRubriques(id?: number, slug?: string): Observable<RubriqueDto[]> {
    let params = new HttpParams();
    if (id) params = params.set('id', id.toString());
    if (slug) params = params.set('slug', slug);
    return this.http.get<RubriqueDto[]>(`${this.API_URL}/rubrique`, { params });
  }

  createRubrique(rubrique: RubriqueSaveDto): Observable<RubriqueDto> {
    return this.http.post<RubriqueDto>(`${this.API_URL}/rubrique`, rubrique);
  }

  updateRubrique(id: number, rubrique: RubriqueSaveDto): Observable<RubriqueDto> {
    return this.http.patch<RubriqueDto>(`${this.API_URL}/rubrique/${id}`, rubrique);
  }

  deleteRubrique(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/rubrique/${id}`);
  }

  // --- CONTACT / MESSAGES ---

  sendMessage(message: MessageContact): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/contact`, message);
  }

  // --- TÉLÉCHARGEMENT ---

  getDownloadUrl(type: 'articles' | 'journal', fileName: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${type}/download/${fileName}`, { responseType: 'blob' });
  }

  
}