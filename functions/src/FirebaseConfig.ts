import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Auth } from "firebase-admin/auth";

const FIREBASE_STORAGE_BUCKET = "fir-recipes-9dfd5.appspot.com";

const apiFirebaseOptions: admin.AppOptions = {
  ...functions.config().firebase,
  credential: admin.credential.applicationDefault(),
};

admin.initializeApp(apiFirebaseOptions);
const firestore: admin.firestore.Firestore = admin.firestore();
const settings = { timeshotsInSnapshots: true };

firestore.settings(settings);

const storageBucket = admin
  .storage()
  .bucket(FIREBASE_STORAGE_BUCKET);
const auth: Auth = admin.auth();

export { functions, auth, storageBucket, firestore, admin };
