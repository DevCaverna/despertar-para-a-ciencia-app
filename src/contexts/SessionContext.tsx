import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { userService } from '@/services/user.service';
import { auth, firebaseConfigurationAvailable } from '@/services/firebase.service';
import type { UserProfile } from '@/models/user.model';

export type ProfileStatus = 'loading' | 'ready' | 'not-found' | 'inactive' | 'error' | 'none';
export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';

interface SessionContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  status: SessionStatus;
  profileStatus: ProfileStatus;
  profileError: unknown;
  loadProfile: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>(firebaseConfigurationAvailable ? 'initializing' : 'unauthenticated');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('none');
  const [profileError, setProfileError] = useState<unknown>(null);
  const profileRequestId = useRef(0);

  const loadProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    const uid = auth?.currentUser?.uid;
    setProfileStatus('loading');
    setProfileError(null);
    try {
      const current = await userService.getProfile();
      if (requestId !== profileRequestId.current || uid !== auth?.currentUser?.uid) return null;
      setProfile(current);
      setProfileStatus(current.active ? 'ready' : 'inactive');
      return current;
    } catch (error) {
      if (requestId !== profileRequestId.current || uid !== auth?.currentUser?.uid) return null;
      setProfile(null);
      setProfileError(error);
      if ((error as { response?: { status?: number } }).response?.status === 404) setProfileStatus('not-found');
      else if ((error as { response?: { status?: number } }).response?.status === 403) setProfileStatus('inactive');
      else setProfileStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigurationAvailable || !auth) {
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      profileRequestId.current += 1;
      setUser(firebaseUser);
      setProfile(null);
      setProfileError(null);
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
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({ user, profile, status, profileStatus, profileError, loadProfile, logout }), [user, profile, status, profileStatus, profileError, loadProfile, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession precisa estar dentro de SessionProvider.');
  return context;
}
