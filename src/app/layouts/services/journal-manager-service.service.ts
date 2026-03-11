import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  ArticleDto, ArticleSaveDto, 
  JournalPdfDto, JournalPdfSaveDto, 
  RubriqueDto, RubriqueSaveDto, 
  MessageContact, Page, 
  ArticleSectionDto
} from '../../model/model'; 
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JournalManagerService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api/v1/journal-manager`;

  getArticles(
    id?: number, rubriqueId?: number, search?: string, statut?: string,
    dateDebut?: Date, dateFin?: Date, page: number = 0, size: number = 10
  ): Observable<Page<ArticleDto>> {
    let params = new HttpParams();

    if (id) params = params.set('id', id.toString());
    if (rubriqueId) params = params.set('rubriqueId', rubriqueId.toString());
    if (search) params = params.set('search', search);
    if (statut) params = params.set('statut', statut);

    if (dateDebut) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      params = params.set('dateDebut', debut.toISOString());
    }
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      params = params.set('dateFin', fin.toISOString());
    }

    params = params.set('page', page.toString());
    params = params.set('size', size.toString());

    return this.http.get<Page<ArticleDto>>(`${this.API_URL}/articles`, { params });
  }

  getArticleBySlug(slug: string): Observable<ArticleDto> {
    return this.http.get<ArticleDto>(`${this.API_URL}/articles/${slug}`);
  }

  saveArticle(
    id: number | null,
    article: ArticleSaveDto,
    imageFile?: File,
    sections?: ArticleSectionDto[],
    sectionImages?: (File | null)[]
  ): Observable<ArticleDto> {
    const formData = new FormData();
    formData.append('titre', article.titre);
    formData.append('contenu', article.contenu);
    formData.append('statut', article.statut);
    formData.append('rubriqueId', article.rubriqueId.toString());

    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Sections : on envoie le JSON sans imageFile (champ local uniquement)
    if (sections && sections.length > 0) {
      const sectionsPayload = sections.map(({ imageFile: _, ...s }) => s);
      formData.append('sections', JSON.stringify(sectionsPayload));

      // Images des sections dans le même ordre que les sections
      if (sectionImages && sectionImages.length > 0) {
        sectionImages.forEach((file) => {
          // On append toujours, même null → le backend reçoit une liste ordonnée
          formData.append('sectionImages', file ?? new Blob(), file ? file.name : '');
        });
      }
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

  // --- Sections (endpoints indépendants) ---

  getSectionsByArticle(articleId: number): Observable<ArticleSectionDto[]> {
    return this.http.get<ArticleSectionDto[]>(`${this.API_URL}/articles/${articleId}/sections`);
  }

  saveSection(articleId: number, section: ArticleSectionDto, imageFile?: File): Observable<ArticleSectionDto> {
    const formData = new FormData();
    const { imageFile: _, ...payload } = section;
    formData.append('section', JSON.stringify(payload));
    if (imageFile) formData.append('image', imageFile);

    if (section.id) {
      return this.http.patch<ArticleSectionDto>(`${this.API_URL}/articles/${articleId}/sections/${section.id}`, formData);
    } else {
      return this.http.post<ArticleSectionDto>(`${this.API_URL}/articles/${articleId}/sections`, formData);
    }
  }

  deleteSection(articleId: number, sectionId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/articles/${articleId}/sections/${sectionId}`);
  }

  deleteAllSections(articleId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/articles/${articleId}/sections`);
  }

  // --- JOURNAUX PDF ---

  getJournals(id?: number, statut?: string, search?: string, dateDebut?: Date, dateFin?: Date, page: number = 0, size: number = 9): Observable<Page<JournalPdfDto>> {
    let params = new HttpParams();

    if (id) params = params.set('id', id.toString());
    if (statut) params = params.set('statut', statut);
    if (search) params = params.set('search', search);

    if (dateDebut) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      params = params.set('dateDebut', debut.toISOString());
    }

    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      params = params.set('dateFin', fin.toISOString());
    }

    params = params.set('page', page.toString());
    params = params.set('size', size.toString());

    return this.http.get<Page<JournalPdfDto>>(`${this.API_URL}/journal`, { params });
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

  getRubriques(id?: number, search?: string, page: number = 0, size: number = 10): Observable<Page<RubriqueDto>> {
    let params = new HttpParams();
    if (id) params = params.set('id', id.toString());
    if (search) params = params.set('search', search);
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    return this.http.get<Page<RubriqueDto>>(`${this.API_URL}/rubrique`, { params });
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

  downloadPdf(fileUrl: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/download-pdf?fileUrl=${encodeURIComponent(fileUrl)}`, {
      responseType: 'blob' 
    });
  }
  
}