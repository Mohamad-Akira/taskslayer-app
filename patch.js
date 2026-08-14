const fs = require('fs');

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Replace imports
content = content.replace(
  "import { onAuthStateChanged } from 'firebase/auth';",
  "import { onAuthStateChanged } from 'firebase/auth';\nimport { doc, getDoc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
