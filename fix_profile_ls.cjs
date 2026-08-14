const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf-8');

const regex = /const \[profile, setProfile\] = useState<RPGProfile>\(\(\) => \{[\s\S]*?return DEFAULT_PROFILE;\n  \}\);/;
code = code.replace(regex, `const [profile, setProfile] = useState<RPGProfile>(() => {
    return DEFAULT_PROFILE;
  });`);

fs.writeFileSync('src/context/AppContext.tsx', code);
