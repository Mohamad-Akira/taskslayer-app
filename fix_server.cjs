const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const startIdx = code.indexOf('// --- CLOUD SYNCHRONIZATION PROTOCOL (CSP) API ---');
const endIdx = code.indexOf('// 404 handler for missing API routes');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
  fs.writeFileSync('server.ts', code);
  console.log("Server patched!");
} else {
  console.error("Could not find boundaries in server.ts");
}
