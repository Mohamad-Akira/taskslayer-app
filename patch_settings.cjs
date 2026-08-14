const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.tsx', 'utf-8');

code = code.replace(
  "console.error('Login failed', err);",
  "console.error('Login failed', err);\n                      alert(language === 'ar' ? 'فشل تسجيل الدخول: يرجى فتح التطبيق في نافذة جديدة للسماح بالنافذة المنبثقة.' : 'Login failed: Please open the app in a new tab to allow the login popup.');"
);

fs.writeFileSync('src/components/SettingsView.tsx', code);
