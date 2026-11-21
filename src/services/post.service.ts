import type { AxiosInstance, AxiosResponse } from 'axios';

import type { DraftPost, PublishedPostDetail, PublishedPostPage } from '@/models/post.model';
import type { DraftValues } from '@/schemas/post.schemas';

export class PostService {
  constructor(private readonly api: AxiosInstance) {}

  listDrafts(page: number, perPage: number): Promise<AxiosResponse<DraftPost[]>> {
    return this.api.get<DraftPost[]>('/posts/drafts', { params: { page, perPage } });
  }

  getDraft(id: string): Promise<AxiosResponse<DraftPost>> {
    return this.api.get<DraftPost>(`/posts/drafts/${encodeURIComponent(id)}`);
  }

  createDraft(payload: DraftValues): Promise<AxiosResponse<DraftPost>> {
    return this.api.post<DraftPost>('/posts', payload);
  }

  updateDraft(id: string, payload: DraftValues): Promise<AxiosResponse<DraftPost>> {
    return this.api.patch<DraftPost>(`/posts/${encodeURIComponent(id)}`, payload);
  }

  listPublished(
    page: number,
    perPage: number,
    signal?: AbortSignal,
  ): Promise<AxiosResponse<PublishedPostPage>> {
    return this.api.get<PublishedPostPage>('/posts', {
      params: { page, perPage },
      signal,
      // Axios omits headers with a false value when sending the request.
      headers: { Authorization: false },
    });
  }

  getPublished(id: string, signal?: AbortSignal): Promise<AxiosResponse<PublishedPostDetail>> {
    return this.api.get<PublishedPostDetail>(`/posts/${encodeURIComponent(id)}`, {
      signal,
      headers: { Authorization: false },
    });
  }
}
