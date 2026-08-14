const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const replacement = `
  // Sync current client state to server
  const syncData = async (forcePush = false): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    
    setIsSyncing(true);
    setSyncError(null);
    try {
      // 1. Update user profile document
      const userDocRef = doc(db, 'users', user.uid);
      const userProfilePayload = {
        userId: user.uid,
        profile,
        shopItems,
        gameLogs,
        pomodoroStats,
        isDead,
        deathStats: deathStats || {},
        theme,
        language,
        notificationsEnabled,
        viewsOrder: JSON.parse(localStorage.getItem('taskslayer_views_order') || localStorage.getItem('ticktick_views_order') || '[]'),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, userProfilePayload, { merge: true });

      // 2. Sync Tasks
      // To keep it simple without complex diffing, we'll write all tasks.
      const batch = writeBatch(db);
      
      // Get existing tasks to delete ones that were removed locally
      const tasksRef = collection(db, 'users', user.uid, 'tasks');
      const existingTasksSnap = await getDocs(tasksRef);
      const existingIds = new Set(existingTasksSnap.docs.map(d => d.id));
      
      const currentIds = new Set(tasks.map(t => t.id));
      
      // Delete tasks that exist in DB but not locally
      existingIds.forEach(id => {
        if (!currentIds.has(id)) {
          batch.delete(doc(db, 'users', user.uid, 'tasks', id));
        }
      });
      
      // Add or Update current tasks
      tasks.forEach(task => {
        batch.set(doc(db, 'users', user.uid, 'tasks', task.id), {
          ...task,
          userId: user.uid,
          updatedAt: new Date().toISOString()
        });
      });
      
      await batch.commit();

      const nowStr = new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      setLastSyncTime(nowStr);
      return true;
    } catch (err: any) {
      console.error('Firestore Sync error:', err);
      setSyncError(err.message || 'Network error.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate new unique Sync Key on the server
  const generateSyncKey = async (): Promise<string | null> => {
    // Disabled in favor of Firebase Auth
    return null;
  };

  // Connect to an existing Sync Key and replace local state
  const connectSyncKey = async (key: string): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;
    
    setIsSyncing(true);
    setSyncError(null);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const cloudData = userDocSnap.data();
        if (cloudData.profile) setProfile(sanitizeProfile(cloudData.profile));
        if (Array.isArray(cloudData.shopItems)) setShopItems(cloudData.shopItems);
        if (Array.isArray(cloudData.gameLogs)) setGameLogs(cloudData.gameLogs);
        if (cloudData.pomodoroStats) setPomodoroStats(cloudData.pomodoroStats);
        if (cloudData.theme) setTheme(cloudData.theme as any);
        if (cloudData.language) setLanguage(cloudData.language as any);
        if (cloudData.isDead !== undefined) setIsDead(cloudData.isDead);
        if (cloudData.deathStats) setDeathStats(cloudData.deathStats);
        if (cloudData.notificationsEnabled !== undefined) setNotificationsEnabledState(cloudData.notificationsEnabled);
        
        // Load tasks
        const tasksRef = collection(db, 'users', user.uid, 'tasks');
        const tasksSnap = await getDocs(tasksRef);
        const cloudTasks = tasksSnap.docs.map(d => d.data() as Task);
        if (cloudTasks.length > 0) {
           setTasks(cloudTasks);
        }

        const nowStr = new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
        setLastSyncTime(nowStr);
        setSyncKeyState(user.uid);
        return true;
      }
      return false;
    } catch (err: any) {
      setSyncError(err.message || 'Error connecting to Firestore.');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect sync
  const disconnectSync = () => {
    setSyncKeyState(null);
    setLastSyncTime(null);
    setUserEmail(null);
    setUserName(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || user.uid);
        if (!localStorage.getItem('taskslayer_user_name') && !localStorage.getItem('ticktick_user_name') && user.displayName) {
          setUserName(user.displayName);
          localStorage.setItem('taskslayer_user_name', user.displayName);
        }
        
        const ok = await connectSyncKey(user.uid);
        if (!ok) {
           // User profile does not exist yet. Let's create it with current state.
           const userDocRef = doc(db, 'users', user.uid);
           const userProfilePayload = {
             userId: user.uid,
             profile,
             shopItems,
             gameLogs,
             pomodoroStats,
             theme,
             language,
             createdAt: new Date().toISOString()
           };
           await setDoc(userDocRef, userProfilePayload);
           setSyncKeyState(user.uid);
        }
      } else {
        disconnectSync();
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-sync effect
  useEffect(() => {
    if (!syncKey) return;
    const timeout = setTimeout(() => {
      syncData();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [syncKey, tasks, profile, shopItems, gameLogs, pomodoroStats, isDead, theme, language]);
`;

// we need to locate the CSP section and replace it.
const startIdx = code.indexOf('// Sync current client state to server');
const endIdx = code.indexOf('return (', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + replacement + '\n  ' + code.substring(endIdx);
  fs.writeFileSync('src/context/AppContext.tsx', code);
  console.log("Patched!");
} else {
  console.error("Could not find boundaries");
}
