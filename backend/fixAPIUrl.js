const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/Login.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/AdminDashboard.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/FacultyDashboard.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/StudentDashboard.jsx'
];

const apiDeclaration = `
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'
  : 'https://collegeerp-system.onrender.com';
`;

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check UTF-16 encoding
    if (content.includes('\u0000')) {
      content = fs.readFileSync(file, 'utf16le');
    }
    
    const basename = path.basename(file);
    
    // 1. Remove the declaration from the very top if it exists
    if (content.startsWith(apiDeclaration)) {
      console.log(`Removing misplaced API_URL from the top of: ${basename}`);
      content = content.replace(apiDeclaration, '');
    } else {
      // In case there is an extra newline
      const apiDeclarationWithNewLine = apiDeclaration + '\n';
      if (content.startsWith(apiDeclarationWithNewLine)) {
        console.log(`Removing misplaced API_URL (with newline) from the top of: ${basename}`);
        content = content.replace(apiDeclarationWithNewLine, '');
      }
    }
    
    // 2. Append the declaration to the bottom of the file (completely safe for ES Modules)
    if (!content.includes('const API_URL =')) {
      console.log(`Appending API_URL to the bottom of: ${basename}`);
      content = content + '\n' + apiDeclaration;
    }
    
    // Save in correct encoding
    if (content.includes('\u0000')) {
      fs.writeFileSync(file, content, 'utf16le');
    } else {
      fs.writeFileSync(file, content, 'utf8');
    }
    console.log(`Repositioned API_URL successfully in: ${basename}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log("Global API declaration repositioning completed successfully!");
