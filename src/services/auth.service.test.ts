import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createProfile, getIdToken, requireAuth } = vi.hoisted(() => ({
  createProfile: vi.fn(),
  getIdToken: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/services/firebase.service', () => ({ requireAuth }));
import { completeProfile } from '@/services/auth.service';

const userService = { createProfile } as never;

describe('conclusão do perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockReturnValue({ currentUser: { email: 'ada@example.com', getIdToken } });
    createProfile.mockResolvedValue({ id: 'profile-uuid' });
  });

  it('cria o perfil e renova as claims do Firebase após a resposta da API', async () => {
    createProfile.mockResolvedValue({ data: { id: 'profile-uuid' } });
    await expect(
      completeProfile(
        { name: 'Ada Lovelace', email: 'ada@example.com', code: '123456' },
        userService,
      ),
    ).resolves.toEqual({ id: 'profile-uuid' });
    expect(createProfile).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      code: '123456',
    });
    expect(getIdToken).toHaveBeenCalledWith(true);
  });

  it('não envia código para a API quando o e-mail não corresponde à conta Firebase', async () => {
    await expect(
      completeProfile({ name: 'Ada', email: 'wrong@example.com', code: '123456' }, userService),
    ).rejects.toThrow('authEmailMismatch');
    expect(createProfile).not.toHaveBeenCalled();
  });
});
