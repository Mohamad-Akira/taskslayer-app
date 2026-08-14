const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf-8');

code = code.replace(
  "export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);",
  "export const db = (firebaseConfig as any).firestoreDatabaseId ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) : getFirestore(app);"
);

fs.writeFileSync('src/lib/firebase.ts', code);
