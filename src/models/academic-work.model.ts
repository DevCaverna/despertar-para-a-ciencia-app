export interface AcademicSource {
  id: string;
  name: string;
  issn: string;
}

export interface AcademicWork {
  id: string;
  doi: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publicationDate: string | null;
  journal: string | null;
  url: string | null;
  source: AcademicSource;
}

export interface AcademicWorkPage {
  items: AcademicWork[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
}
