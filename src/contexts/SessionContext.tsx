import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useApi } from '@/hooks/useApi';
import type { UserProfile } from '@/models/user.model';
import { auth, firebaseConfigurationAvailable } from '@/services/firebase.service';
import { UserService } from '@/services/user.service';

export type ProfileStatus = 'loading' | 'ready' | 'not-found' | 'inactive' | 'error' | 'none';
export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';
export type EditorAccess = 'checking' | 'allowed' | 'denied';

interface SessionContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  status: SessionStatus;
  profileStatus: ProfileStatus;
  profileError: unknown;
  editorAccess: EditorAccess;
  loadProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const userService = useMemo(() => new UserService(api), [api]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>(
    firebaseConfigurationAvailable ? 'initializing' : 'unauthenticated',
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('none');
  const [profileError, setProfileError] = useState<unknown>(null);
  const [editorAccess, setEditorAccess] = useState<EditorAccess>('denied');
  const profileRequestId = useRef(0);

  const loadProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    const uid = auth?.currentUser?.uid;
    setProfileStatus('loading');
    setProfileError(null);
    setEditorAccess('checking');
    try {
      const { data: current } = await userService.getProfile();
      if (requestId !== profileRequestId.current || uid !== auth?.currentUser?.uid) return null;
      setProfile(current);
      setProfileStatus(current.active ? 'ready' : 'inactive');
      if (current.active) {
        try {
          const token = await auth?.currentUser?.getIdTokenResult();
          if (requestId !== profileRequestId.current || uid !== auth?.currentUser?.uid) return null;
          const roles = token?.claims.roles;
          setEditorAccess(
            Array.isArray(roles) &&
              roles.some((role) => role === 'COLLABORATOR' || role === 'ADMIN')
              ? 'allowed'
              : 'denied',
          );
        } catch {
          if (requestId === profileRequestId.current) setEditorAccess('denied');
        }
      } else {
        setEditorAccess('denied');
      }
      return current;
    } catch (error) {
      if (requestId !== profileRequestId.current || uid !== auth?.currentUser?.uid) return null;
      setProfile(null);
      setProfileError(error);
      setEditorAccess('denied');
      if ((error as { response?: { status?: number } }).response?.status === 404)
        setProfileStatus('not-found');
      else if ((error as { response?: { status?: number } }).response?.status === 403)
        setProfileStatus('inactive');
      else setProfileStatus('error');
      return null;
    }
  }, [userService]);

  useEffect(() => {
    if (!firebaseConfigurationAvailable || !auth) {
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      profileRequestId.current += 1;
      setUser(firebaseUser);
      setProfile(null);
      setProfileError(null);
      setEditorAccess(firebaseUser ? 'checking' : 'denied');
      if (firebaseUser) {
        setStatus('authenticated');
        await loadProfile();
      } else {
        setStatus('unauthenticated');
        setProfileStatus('none');
      }
    });
  }, [loadProfile]);

  const logout = useCallback(async () => {
    profileRequestId.current += 1;
    if (auth) await signOut(auth);
    setUser(null);
    setProfile(null);
    setProfileError(null);
    setProfileStatus('none');
    setEditorAccess('denied');
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      status,
      profileStatus,
      profileError,
      editorAccess,
      loadProfile,
      logout,
    }),
    [user, profile, status, profileStatus, profileError, editorAccess, loadProfile, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider.');
  return context;
}
