import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';
import { loginWithPassword } from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({ loginWithPassword: vi.fn() }));

describe('tela de login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia credenciais válidas e navega para a página inicial', async () => {
    vi.mocked(loginWithPassword).mockResolvedValue({} as never);
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Início autenticado</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(loginWithPassword).toHaveBeenCalledWith('ada@example.com', 'password'));
    expect(await screen.findByText('Início autenticado')).toBeInTheDocument();
  });

  it('apresenta erros recuperáveis de credenciais sem expor erro técnico', async () => {
    vi.mocked(loginWithPassword).mockRejectedValue(Object.assign(new Error('technical details'), { code: 'auth/invalid-credential' }));
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.');
  });
});
