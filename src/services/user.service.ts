import type { AxiosInstance, AxiosResponse } from 'axios';

import type { CreateProfileDto, SendVerificationCodeDto } from '@/dtos/profile.dto';
import type { UserProfile } from '@/models/user.model';

export class UserService {
  private readonly baseUrl = '/users';

  constructor(private readonly api: AxiosInstance) {}

  getProfile(): Promise<AxiosResponse<UserProfile>> {
    return this.api.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  createProfile(payload: CreateProfileDto): Promise<AxiosResponse<UserProfile>> {
    return this.api.post<UserProfile>(`${this.baseUrl}/profile`, payload);
  }

  sendVerificationCode(payload: SendVerificationCodeDto): Promise<AxiosResponse<void>> {
    return this.api.post<void>(`${this.baseUrl}/send-email-verification-code`, payload);
  }
}
