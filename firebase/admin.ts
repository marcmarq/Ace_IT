import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const initFirebaseAdmin = () => {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Missing Firebase Admin credentials in environment variables.'
      );
    }

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
};

export const { auth, db } = initFirebaseAdmin();
