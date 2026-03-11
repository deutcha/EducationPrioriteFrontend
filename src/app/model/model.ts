import { StatutArticle, StatutJournal } from "./enum";

/**
 * Modèles Rubrique
 */
export interface RubriqueDto {
  id: number;
  nom: string;
  slug: string;
  description?: string;
}

export interface RubriqueSaveDto {
  nom: string;
  description?: string;
}

/**
 * Modèles Article
 */
export interface ArticleSectionDto {
  id?: number;
  contenu: string;
  image?: string;
  ordre: number;
  imageFile?: File; 
}

export interface ArticleDto {
  id: number;
  titre: string;
  slug: string;
  contenu: string;
  image?: string;
  datePublication: string;
  statut: StatutArticle;
  rubriqueId: number;
  rubriqueNom: string;
  sections?: ArticleSectionDto[]; 
}

export interface ArticleSaveDto {
  titre: string;
  contenu: string;
  statut: StatutArticle;
  rubriqueId: number;
}

/**
 * Modèles Journal PDF
 */
export interface JournalPdfDto {
  id: number;
  titre: string;
  slug: string;
  description?: string;
  fichierPdf: string;
  imageCouverture?: string;
  statut: StatutJournal;
  dateAjout: string;
}

export interface JournalPdfSaveDto {
  titre: string;
  statut: StatutJournal;
  description?: string;
}

/**
 * Modèle Message Contact (Entité directe)
 */
export interface MessageContact {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}