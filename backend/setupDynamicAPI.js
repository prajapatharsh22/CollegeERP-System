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
    
    // Inject API_URL at the top of the file before imports
    if (!content.includes('const API_URL =')) {
      console.log(`Injecting API_URL declaration into: ${basename}`);
      content = apiDeclaration + '\n' + content;
    }

    // Now replace the API endpoints
    // 1. Template literal replacement
    let updatedContent = content.replace(/http:\/\/127\.0\.0\.1:5000/g, '${API_URL}');
    
    // 2. Normal string replacement (concatenation)
    updatedContent = updatedContent.replace(/'\${API_URL}/g, "API_URL + '");
    updatedContent = updatedContent.replace(/"\${API_URL}/g, 'API_URL + "');
    
    // Save in correct encoding
    if (content.includes('\u0000')) {
      fs.writeFileSync(file, updatedContent, 'utf16le');
    } else {
      fs.writeFileSync(file, updatedContent, 'utf8');
    }
    console.log(`Updated file: ${basename}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log("Global API Configuration completed successfully!");
