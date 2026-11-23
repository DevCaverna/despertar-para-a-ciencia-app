import type { AxiosInstance, AxiosResponse } from 'axios';

import type { AcademicWork, AcademicWorkPage } from '@/models/academic-work.model';

export class AcademicWorkService {
  constructor(private readonly api: AxiosInstance) {}

  list(
    page: number,
    perPage: number,
    signal?: AbortSignal,
  ): Promise<AxiosResponse<AcademicWorkPage>> {
    return this.api.get<AcademicWorkPage>('/academic-works', { params: { page, perPage }, signal });
  }

  get(id: string, signal?: AbortSignal): Promise<AxiosResponse<AcademicWork>> {
    return this.api.get<AcademicWork>(`/academic-works/${encodeURIComponent(id)}`, { signal });
  }
}
