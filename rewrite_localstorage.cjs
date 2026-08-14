const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

// Replace local storage reads for state initialization
code = code.replace(/const saved = localStorage\.getItem\('ticktick_tasks'\);\s+return saved \? JSON\.parse\(saved\) : DEFAULT_TASKS;/g, 'return DEFAULT_TASKS;');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_active_task_id'\);\s+return saved \|\| null;/g, 'return null;');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_pomo_stats'\);\s+return saved \? JSON\.parse\(saved\) : { completedSessions: 0, totalMinutes: 0 };/g, 'return { completedSessions: 0, totalMinutes: 0 };');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_rpg_profile'\);\s+return saved \? JSON\.parse\(saved\) : DEFAULT_PROFILE;/g, 'return DEFAULT_PROFILE;');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_rpg_shop'\);\s+return saved \? JSON\.parse\(saved\) : DEFAULT_SHOP;/g, 'return DEFAULT_SHOP;');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_rpg_logs'\);\s+return saved \? JSON\.parse\(saved\) : \[\s+{\s+id: '1',\s+message: 'Welcome.*?',\s+timestamp: new Date\(\)\.toISOString\(\),\s+type: 'xp'\s+}\s+\];/gs, `return [
      { id: '1', message: 'Welcome to your RPG Life Questboard! Level up by completing tasks.', timestamp: new Date().toISOString(), type: 'xp' }
    ];`);
code = code.replace(/return localStorage\.getItem\('ticktick_is_dead'\) === 'true';/g, 'return false;');
code = code.replace(/const saved = localStorage\.getItem\('ticktick_death_stats'\);\s+return saved \? JSON\.parse\(saved\) : null;/g, 'return null;');

// user sync info
code = code.replace(/return localStorage\.getItem\('ticktick_sync_key'\) \|\| null;/g, 'return null;');
code = code.replace(/return localStorage\.getItem\('ticktick_last_sync_time'\) \|\| null;/g, 'return null;');
code = code.replace(/return localStorage\.getItem\('ticktick_user_name'\);/g, 'return null;');
code = code.replace(/return localStorage\.getItem\('ticktick_user_avatar'\) \|\| 'default';/g, "return 'default';");

// Remove local storage sets inside useEffects
const removeSetItemRegex = /localStorage\.set(Item|Remove)\('(taskslayer_|ticktick_)(tasks|active_task_id|pomo_stats|rpg_profile|rpg_shop|rpg_logs|is_dead|death_stats|sync_key|last_sync_time|user_name|user_avatar)'.*?\);/g;
code = code.replace(removeSetItemRegex, '');

fs.writeFileSync('src/context/AppContext.tsx', code);
console.log("LocalStorage replacements complete!");
