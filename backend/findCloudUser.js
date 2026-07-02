const mongoose = require('mongoose');
const models = require('./models');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valParts] = trimmedLine.split('=');
      if (key) {
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  });
}

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_erp';
console.log("Connecting to:", mongoURI.split('@')[1] || mongoURI); // Log database name safely without credentials

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("=== CLOUD USERS ===");
    const users = await models.User.find({});
    console.log(JSON.stringify(users, null, 2));
    
    console.log("=== CLOUD REGISTRATION REQUESTS ===");
    const reqs = await models.RegistrationRequest.find({});
    console.log(JSON.stringify(reqs, null, 2));
    
    process.exit();
  })
  .catch(err => {
    console.error("Connection Error:", err);
    process.exit(1);
  });
