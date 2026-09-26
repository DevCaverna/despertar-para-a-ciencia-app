export const errors = {
  validationEmail: 'Informe um e-mail válido.',
  validationPassword: 'Informe sua senha.',
  validationName: 'Informe seu nome.',
  validationNameLength: 'O nome deve ter no máximo 160 caracteres.',
  validationPasswordLength: 'A senha deve ter pelo menos 8 caracteres.',
  validationConfirmPassword: 'Confirme sua senha.',
  validationPasswordMismatch: 'As senhas não coincidem.',
  validationCode: 'Informe os seis dígitos do código.',
  authInvalidCredentials: 'E-mail ou senha incorretos.',
  authEmailInUse:
    'Já existe uma conta com este e-mail. Entre com sua senha para concluir o cadastro.',
  authWeakPassword: 'Escolha uma senha com pelo menos 8 caracteres.',
  authInvalidEmail: 'Informe um endereço de e-mail válido.',
  authTooManyRequests: 'Muitas tentativas de acesso. Aguarde um pouco e tente novamente.',
  authNetworkError:
    'Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.',
  authUserDisabled: 'Esta conta está desativada. Entre em contato com a equipe responsável.',
  authGenericError: 'Não foi possível concluir a autenticação. Tente novamente.',
  errorInvalidCode:
    'O código informado é inválido ou expirou. Confira o código e solicite outro se necessário.',
  errorUnauthorized: 'Sua sessão precisa ser autenticada novamente. Entre para continuar.',
  errorForbidden:
    'Este perfil está inativo ou não tem acesso. Entre em contato com a equipe responsável.',
  errorProfileNotFound:
    'Ainda não encontramos um perfil para esta conta. Conclua seu cadastro para continuar.',
  errorConflict: 'Não foi possível associar este perfil à conta. Confira o e-mail utilizado.',
  errorRateLimited: 'Muitas solicitações em pouco tempo. Aguarde antes de pedir outro código.',
  errorUnavailable:
    'O serviço está temporariamente indisponível. Sua sessão foi mantida; tente novamente em instantes.',
  errorUnexpected: 'Ocorreu um erro inesperado. Tente novamente.',
  firebaseNotConfigured:
    'A autenticação ainda não foi configurada. Confira as variáveis VITE_FIREBASE_* no .env.local.',
  authLoginRequired: 'Entre na conta para concluir o perfil.',
  authEmailMismatch:
    'O e-mail precisa corresponder à conta autenticada. Saia e entre com a conta correta.',
};
