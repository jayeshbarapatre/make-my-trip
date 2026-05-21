const fs = require('fs');
const path = require('path');

function searchAndReplace(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      searchAndReplace(fullPath);
    } else if (/\.(css|jsx|js)$/.test(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const original = content;
      content = content.replace(/font-family:\s*['"]?Space Grotesk['"]?,\s*serif;?/g, "font-family: 'Space Grotesk', sans-serif;");
      content = content.replace(/fontFamily:\s*['"]Space Grotesk,\s*serif['"]/g, "fontFamily: 'Space Grotesk, sans-serif'");
      
      content = content.replace(/font-family:\s*['"]?Space Grotesk['"]?,\s*-apple-system,\s*BlinkMacSystemFont,\s*['"]?Segoe UI['"]?,\s*sans-serif;?/g, "font-family: 'Space Grotesk', sans-serif;");
      
      content = content.replace(/fontFamily:\s*['"]Space Grotesk,\s*sans-serif['"]/g, "fontFamily: 'Space Grotesk, sans-serif'");
      
      content = content.replace(/font-family:\s*['"]?Space Grotesk['"]?,\s*sans-serif;?/g, "font-family: 'Space Grotesk', sans-serif;");
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

searchAndReplace('h:/make-my-trip-practical/makemytrip-frontend/src');
