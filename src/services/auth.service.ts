import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';

import type { CreateProfileDto } from '@/dtos/profile.dto';
import { requireAuth } from '@/services/firebase.service';
import type { UserService } from '@/services/user.service';

export async function loginWithPassword(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email, password);
}

export async function createFirebaseAccount(
  name: string,
  email: string,
  password: string,
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(requireAuth(), email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential;
}

export async function completeProfile(payload: CreateProfileDto, userService: UserService) {
  const firebaseUser = requireAuth().currentUser;
  if (!firebaseUser) throw new Error('authLoginRequired');
  if (firebaseUser.email?.trim().toLowerCase() !== payload.email.trim().toLowerCase()) {
    throw new Error('authEmailMismatch');
  }
  const { data: profile } = await userService.createProfile(payload);
  await firebaseUser.getIdToken(true);
  return profile;
}

export async function logoutFromFirebase() {
  await signOut(requireAuth());
}
