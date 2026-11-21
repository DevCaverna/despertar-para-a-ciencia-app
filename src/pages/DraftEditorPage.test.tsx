import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DraftEditorPage } from '@/pages/DraftEditorPage';
import { PostService } from '@/services/post.service';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderEditor(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Link to="/drafts/new">Novo formulário</Link>
      <Link to="/drafts/another-id/edit">Outro rascunho</Link>
      <Routes>
        <Route path="/drafts/new" element={<DraftEditorPage />} />
        <Route path="/drafts/:id/edit" element={<DraftEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('editor de rascunhos', () => {
  it('limpa o formulário ao navegar da edição para um novo rascunho', async () => {
    vi.spyOn(PostService.prototype, 'getDraft').mockResolvedValue({
      data: { title: 'Anterior', content: 'Texto' },
    } as never);
    renderEditor('/drafts/draft-id/edit');
    expect(await screen.findByDisplayValue('Anterior')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Novo formulário' }));
    await waitFor(() => expect(screen.getByLabelText('Título')).toHaveValue(''));
    expect(screen.getByLabelText('Corpo do post')).toHaveValue('');
  });

  it('permite carregar outro rascunho depois de uma falha', async () => {
    vi.spyOn(PostService.prototype, 'getDraft')
      .mockRejectedValueOnce(new Error('Falha'))
      .mockResolvedValueOnce({ data: { title: 'Outro', content: 'Texto' } } as never);
    renderEditor('/drafts/draft-id/edit');
    expect(await screen.findByText('Falha')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Outro rascunho' }));
    expect(await screen.findByDisplayValue('Outro')).toBeInTheDocument();
    expect(screen.queryByText('Falha')).not.toBeInTheDocument();
  });
  it('rejeita campos vazios e cria um rascunho com título e conteúdo', async () => {
    const create = vi
      .spyOn(PostService.prototype, 'createDraft')
      .mockResolvedValue({ data: { id: 'draft-id' } } as never);
    vi.spyOn(PostService.prototype, 'getDraft').mockResolvedValue({
      data: { title: 'Título', content: 'Corpo' },
    } as never);
    renderEditor('/drafts/new');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    expect(await screen.findByText('Informe o título do post.')).toBeInTheDocument();
    expect(screen.getByText('Informe o corpo do post.')).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Título' } });
    fireEvent.change(screen.getByLabelText('Corpo do post'), { target: { value: 'Corpo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ title: 'Título', content: 'Corpo' }));
  });

  it('carrega e salva um rascunho existente', async () => {
    vi.spyOn(PostService.prototype, 'getDraft').mockResolvedValue({
      data: { title: 'Anterior', content: 'Texto' },
    } as never);
    const update = vi
      .spyOn(PostService.prototype, 'updateDraft')
      .mockResolvedValue({ data: { title: 'Atualizado', content: 'Texto' } } as never);
    renderEditor('/drafts/draft-id/edit');
    expect(await screen.findByDisplayValue('Anterior')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('draft-id', { title: 'Atualizado', content: 'Texto' }),
    );
    expect(await screen.findByText('Rascunho salvo.')).toBeInTheDocument();
  });

  it('não permite edição quando o rascunho não pode ser carregado', async () => {
    vi.spyOn(PostService.prototype, 'getDraft').mockRejectedValue(new Error('Falha'));
    renderEditor('/drafts/draft-id/edit');
    expect(await screen.findByText('Falha')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument();
  });
});
