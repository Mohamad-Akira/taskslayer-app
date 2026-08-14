const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

code = code.replace(/const resData = await res\.json\(\);/g, `
      const contentType = res.headers.get("content-type");
      let resData;
      if (contentType && contentType.includes("application/json")) {
        resData = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Invalid response from server: " + text.substring(0, 100));
      }
`);

fs.writeFileSync('src/context/AppContext.tsx', code);
