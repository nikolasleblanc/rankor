import { auth } from './firebase';

export const doCreateUserWithEmailAndPassword =
  auth.createUserWithEmailAndPassword;

export const doSignInWithEmailAndPassword = auth.signInWithEmailAndPassword;

export const doSignOut = auth.signOut;

export const doPasswordUpdate = auth.currentUser
  ? auth.currentUser.updatePassword
  : null;
