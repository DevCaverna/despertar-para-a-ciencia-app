export const errors = {
  validationEmail: 'Introduce un correo electrónico válido.',
  validationPassword: 'Introduce tu contraseña.',
  validationName: 'Introduce tu nombre.',
  validationNameLength: 'El nombre debe tener 160 caracteres como máximo.',
  validationPasswordLength: 'La contraseña debe tener al menos 8 caracteres.',
  validationConfirmPassword: 'Confirma tu contraseña.',
  validationPasswordMismatch: 'Las contraseñas no coinciden.',
  validationCode: 'Introduce los seis dígitos del código.',
  authInvalidCredentials: 'Correo o contraseña incorrectos.',
  authEmailInUse:
    'Ya existe una cuenta con este correo. Inicia sesión con su contraseña para completar el registro.',
  authWeakPassword: 'Elige una contraseña de al menos 8 caracteres.',
  authInvalidEmail: 'Introduce un correo electrónico válido.',
  authTooManyRequests: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  authNetworkError:
    'No se pudo conectar con el servicio de autenticación. Comprueba tu conexión e inténtalo de nuevo.',
  authUserDisabled: 'Esta cuenta está desactivada. Contacta con el equipo responsable.',
  authGenericError: 'No se pudo completar la autenticación. Inténtalo de nuevo.',
  errorInvalidCode: 'El código no es válido o ha caducado. Compruébalo o solicita uno nuevo.',
  errorUnauthorized: 'Tu sesión debe autenticarse de nuevo. Inicia sesión para continuar.',
  errorForbidden:
    'Este perfil está inactivo o no tiene acceso. Contacta con el equipo responsable.',
  errorProfileNotFound:
    'No encontramos un perfil para esta cuenta. Completa el registro para continuar.',
  errorConflict: 'No se pudo vincular este perfil a la cuenta. Comprueba el correo utilizado.',
  errorRateLimited: 'Demasiadas solicitudes. Espera antes de pedir otro código.',
  errorUnavailable:
    'El servicio no está disponible temporalmente. Conservamos tu sesión; inténtalo de nuevo pronto.',
  errorUnexpected: 'Se produjo un error inesperado. Inténtalo de nuevo.',
  firebaseNotConfigured:
    'La autenticación aún no está configurada. Revisa las variables VITE_FIREBASE_* en .env.local.',
  authLoginRequired: 'Inicia sesión para completar el perfil.',
  authEmailMismatch:
    'El correo debe coincidir con la cuenta autenticada. Cierra sesión e inicia con la cuenta correcta.',
};
