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
    
    // 1. Remove all declarations of API_URL (both top, bottom, and broken versions)
    // Matches: const API_URL = window.location.hostname ... ending with 'https://collegeerp-system.onrender.com';
    const apiDeclRegex = /const\s+API_URL\s*=\s*window\.location\.hostname[\s\S]*?'https:\/\/collegeerp-system\.onrender\.com';/g;
    content = content.replace(apiDeclRegex, '');
    
    // 2. Restore all API_URL usages back to plain text localhost URLs
    // Replace API_URL + ' with 'http://127.0.0.1:5000
    content = content.replace(/API_URL\s*\+\s*'/g, "'http://127.0.0.1:5000");
    content = content.replace(/API_URL\s*\+\s*"/g, '"http://127.0.0.1:5000');
    content = content.replace(/\$\{API_URL\}/g, 'http://127.0.0.1:5000');
    
    // 3. Now perform the endpoint replacements on the clean file
    // Template literal replacement
    let updatedContent = content.replace(/http:\/\/127\.0\.0\.1:5000/g, '${API_URL}');
    
    // Normal string concatenation replacement
    updatedContent = updatedContent.replace(/'\${API_URL}/g, "API_URL + '");
    updatedContent = updatedContent.replace(/"\${API_URL}/g, 'API_URL + "');
    
    // 4. Finally, append the single correct declaration to the bottom of the file
    updatedContent = updatedContent.trim() + '\n\n' + apiDeclaration.trim() + '\n';
    
    // Save in correct encoding
    if (content.includes('\u0000')) {
      fs.writeFileSync(file, updatedContent, 'utf16le');
    } else {
      fs.writeFileSync(file, updatedContent, 'utf8');
    }
    console.log(`Successfully healed and updated endpoints in: ${basename}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log("Master API healing and setup completed successfully!");
