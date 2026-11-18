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
