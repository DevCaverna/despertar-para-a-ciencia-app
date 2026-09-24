import { api } from '@/services/api.service';
import type { CreateProfileDto, SendVerificationCodeDto } from '@/dtos/profile.dto';
import type { UserProfile } from '@/models/user.model';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get<UserProfile>('/users/profile');
    return data;
  },
  async createProfile(payload: CreateProfileDto): Promise<UserProfile> {
    const { data } = await api.post<UserProfile>('/users/profile', payload);
    return data;
  },
  async sendVerificationCode(payload: SendVerificationCodeDto): Promise<void> {
    await api.post('/users/send-email-verification-code', payload, { skipAuth: true });
  },
};
