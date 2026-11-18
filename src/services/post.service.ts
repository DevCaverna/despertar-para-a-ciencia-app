import type { AxiosInstance, AxiosResponse } from 'axios';

import type { PublishedPostDetail, PublishedPostPage } from '@/models/post.model';

export class PostService {
  constructor(private readonly api: AxiosInstance) {}

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
