const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

code = code.replace(
  "import { getFirestore } from 'firebase/firestore';",
  "import { getFirestore, initializeFirestore } from 'firebase/firestore';"
);

code = code.replace(
  "export const db = (firebaseConfig as any).firestoreDatabaseId ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) : getFirestore(app);",
  "export const db = initializeFirestore(app, { experimentalForceLongPolling: true });"
);

fs.writeFileSync('src/lib/firebase.ts', code);
