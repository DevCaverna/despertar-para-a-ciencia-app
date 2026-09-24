import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigurationAvailable = Object.values(config).every(Boolean);

let authInstance: Auth | null = null;

if (firebaseConfigurationAvailable) {
  const app = getApps()[0] ?? initializeApp(config);
  authInstance = getAuth(app);

  const emulatorUrl = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL;
  if (emulatorUrl) {
    connectAuthEmulator(authInstance, emulatorUrl, { disableWarnings: true });
  }
}

export const auth = authInstance;

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error('A autenticação ainda não foi configurada. Confira as variáveis VITE_FIREBASE_* no .env.local.');
  }
  return auth;
}
