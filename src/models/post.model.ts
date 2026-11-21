export interface DraftPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: 'DRAFT';
  rejectionReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicPostAuthor {
  id: string;
  name: string;
}

export interface PublishedPost {
  id: string;
  title: string;
  publishedAt: string;
  author: PublicPostAuthor | null;
}

export interface PublishedPostPage {
  items: PublishedPost[];
  page: number;
  perPage: number;
  hasNextPage: boolean;
}

export interface PublishedPostDetail extends PublishedPost {
  content: string;
}
