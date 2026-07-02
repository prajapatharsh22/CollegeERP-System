const fs = require('fs');
const path = require('path');

const files = [
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/Login.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/AdminDashboard.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/FacultyDashboard.jsx',
  'C:/Users/HARSH/.gemini/antigravity/scratch/college-erp/frontend/src/pages/StudentDashboard.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check UTF-16 encoding
    if (content.includes('\u0000')) {
      content = fs.readFileSync(file, 'utf16le');
    }
    
    if (content.includes('http://localhost:5000')) {
      console.log(`Updating localhost to 127.0.0.1 in: ${path.basename(file)}`);
      const updatedContent = content.replace(/http:\/\/localhost:5000/g, 'http://127.0.0.1:5000');
      
      // Save in correct encoding
      if (content.includes('\u0000')) {
        fs.writeFileSync(file, updatedContent, 'utf16le');
      } else {
        fs.writeFileSync(file, updatedContent, 'utf8');
      }
    } else {
      console.log(`No localhost:5000 references found in: ${path.basename(file)}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log("IPv4 Endpoint update completed successfully!");
