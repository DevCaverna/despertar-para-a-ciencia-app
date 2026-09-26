export const errors = {
  validationEmail: 'Enter a valid email address.',
  validationPassword: 'Enter your password.',
  validationName: 'Enter your name.',
  validationNameLength: 'Name must be 160 characters or fewer.',
  validationPasswordLength: 'Password must be at least 8 characters.',
  validationConfirmPassword: 'Confirm your password.',
  validationPasswordMismatch: 'Passwords do not match.',
  validationCode: 'Enter the six-digit code.',
  authInvalidCredentials: 'Incorrect email or password.',
  authEmailInUse:
    'An account with this email already exists. Sign in with its password to finish registration.',
  authWeakPassword: 'Choose a password with at least 8 characters.',
  authInvalidEmail: 'Enter a valid email address.',
  authTooManyRequests: 'Too many sign-in attempts. Wait a moment and try again.',
  authNetworkError:
    'Could not connect to the authentication service. Check your connection and try again.',
  authUserDisabled: 'This account is disabled. Contact the support team.',
  authGenericError: 'Could not complete authentication. Please try again.',
  errorInvalidCode: 'The code is invalid or expired. Check it or request a new one.',
  errorUnauthorized: 'Your session needs to be authenticated again. Sign in to continue.',
  errorForbidden: 'This profile is inactive or has no access. Contact the support team.',
  errorProfileNotFound:
    'No profile was found for this account. Complete your registration to continue.',
  errorConflict: 'Could not link this profile to the account. Check the email address.',
  errorRateLimited: 'Too many requests. Wait before requesting another code.',
  errorUnavailable:
    'The service is temporarily unavailable. Your session was preserved; try again shortly.',
  errorUnexpected: 'An unexpected error occurred. Please try again.',
  firebaseNotConfigured:
    'Authentication is not configured yet. Check the VITE_FIREBASE_* variables in .env.local.',
  authLoginRequired: 'Sign in to complete your profile.',
  authEmailMismatch:
    'The email must match the authenticated account. Sign out and use the correct account.',
};
