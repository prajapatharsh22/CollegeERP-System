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

mongoose.connect(mongoURI)
  .then(async () => {
    console.log("Connected to database. Starting cleanup for username: rohit");
    
    // 1. Delete from User collection
    const userDel = await models.User.deleteMany({ username: 'rohit' });
    console.log(`Deleted ${userDel.deletedCount} documents from users collection.`);
    
    // 2. Delete from RegistrationRequest collection
    const reqDel = await models.RegistrationRequest.deleteMany({ username: 'rohit' });
    console.log(`Deleted ${reqDel.deletedCount} documents from registrationrequests collection.`);
    
    console.log("Cleanup completed! Username 'rohit' is now 100% free to register.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Cleanup Error:", err);
    process.exit(1);
  });
