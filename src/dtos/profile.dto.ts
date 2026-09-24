export interface CreateProfileDto {
  name: string;
  email: string;
  code: string;
}

export interface SendVerificationCodeDto {
  email: string;
}
