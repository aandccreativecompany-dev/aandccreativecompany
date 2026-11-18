// Prakriyā web — Firebase configuration.
//
// To switch on Google sign-in + sync with the Android app:
//   1. Firebase console → project "prakriya-82d0e" → Project settings →
//      "Your apps" → Add app → Web (</>). Register it (no hosting needed).
//   2. Copy the firebaseConfig values it shows into the object below.
//   3. Authentication → Settings → Authorized domains → add
//      aandccreativeventures.com (and www.aandccreativeventures.com).
//
// These values are public identifiers, not secrets: access is protected by
// your Firestore security rules (users can only read/write their own
// users/{uid} document), exactly as it is for the Android app.
//
// Leave as `null` and the app works fully on this device without sign-in.
window.PRAKRIYA_FIREBASE = null;
/* Example shape:
window.PRAKRIYA_FIREBASE = {
  apiKey: "AIza...",
  authDomain: "prakriya-82d0e.firebaseapp.com",
  projectId: "prakriya-82d0e",
  storageBucket: "prakriya-82d0e.firebasestorage.app",
  messagingSenderId: "191375066674",
  appId: "1:191375066674:web:xxxxxxxxxxxx"
};
*/
