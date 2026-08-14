const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const badPart = `  return () => unsubscribe();
  }, []);

  // Auto-sync effect: sync 1.5 seconds after any state change if sync key is connected, with a fallback periodic check
  useEffect(() => {
    if (!syncKey) return;
    
    // Debounce and push state changes within 1.5s
    const timeout = setTimeout(() => {
      syncData();
    }, 1500);
    return () => clearTimeout(timeout);
  }, [syncKey, tasks, profile, shopItems, gameLogs, pomodoroStats]);`;

if (code.includes(badPart)) {
  code = code.replace(badPart, '');
  fs.writeFileSync('src/context/AppContext.tsx', code);
  console.log("Fixed!");
} else {
  console.error("Could not find bad part");
}
