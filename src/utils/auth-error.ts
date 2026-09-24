import axios from 'axios';

const firebaseMessages: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Já existe uma conta com este e-mail. Entre com sua senha para concluir o cadastro.',
  'auth/weak-password': 'Escolha uma senha com pelo menos 8 caracteres.',
  'auth/invalid-email': 'Informe um endereço de e-mail válido.',
  'auth/too-many-requests': 'Muitas tentativas de acesso. Aguarde um pouco e tente novamente.',
  'auth/network-request-failed': 'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.',
  'auth/user-disabled': 'Esta conta está desativada. Entre em contato com a equipe responsável.',
};

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return firebaseMessages[error.code] ?? 'Não foi possível concluir a autenticação. Tente novamente.';
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 400) return 'O código informado é inválido ou expirou. Confira o código e solicite outro se necessário.';
    if (status === 401) return 'Sua sessão precisa ser autenticada novamente. Entre para continuar.';
    if (status === 403) return 'Este perfil está inativo ou não tem acesso. Entre em contato com a equipe responsável.';
    if (status === 404) return 'Ainda não encontramos um perfil para esta conta. Conclua seu cadastro para continuar.';
    if (status === 409) return 'Não foi possível associar este perfil à conta. Confira o e-mail utilizado.';
    if (status === 429) return 'Muitas solicitações em pouco tempo. Aguarde antes de pedir outro código.';
    if ((status && status >= 500) || !error.response) return 'O serviço está temporariamente indisponível. Sua sessão foi mantida; tente novamente em instantes.';
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length < 180) return message;
  }
  if (error instanceof Error && error.message.includes('VITE_FIREBASE_')) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
