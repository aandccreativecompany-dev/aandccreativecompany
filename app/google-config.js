// Optional "Back up to my Google Drive" button (Settings). Live sync uses Firebase (firebase-config.js);
// this is only for the user-triggered copy into their own Drive. Scope: drive.file (the app can touch
// only the one backup file it creates). clientId = Web OAuth client of Google Cloud project 191375066674.
// It is a public identifier, not a secret. Set to null to hide the Drive backup buttons.
window.PRAKRIYA_GOOGLE = {
  clientId: "191375066674-nfovb3noep8q4e0kqanill93emno1r8f.apps.googleusercontent.com"
};
