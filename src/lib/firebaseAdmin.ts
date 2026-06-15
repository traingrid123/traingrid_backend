import admin from "firebase-admin";

import { env } from "../config/env";

let firebaseApp: admin.app.App | null = null;

function parseServiceAccount() {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as {
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  throw new Error(
    "Firebase admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
  );
}

export function getFirebaseAdminApp() {
  if (!firebaseApp) {
    const serviceAccount = parseServiceAccount();
    const projectId = serviceAccount.projectId ?? serviceAccount.project_id ?? env.FIREBASE_PROJECT_ID;
    const clientEmail = serviceAccount.clientEmail ?? serviceAccount.client_email;
    const privateKey = serviceAccount.privateKey ?? serviceAccount.private_key;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase service account is incomplete. Check FIREBASE_SERVICE_ACCOUNT_JSON or the Firebase admin env vars."
      );
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      }),
      projectId
    });
  }

  return firebaseApp;
}

export function getFirebaseAdminAuth() {
  return getFirebaseAdminApp().auth();
}
