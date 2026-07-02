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
    console.log("Connected to database. Starting healing process...");
    
    // Find all approved registration requests
    const approvedRequests = await models.RegistrationRequest.find({ status: 'Approved' });
    console.log(`Found ${approvedRequests.length} approved registration requests.`);
    
    for (const req of approvedRequests) {
      // Check if user already exists in main collection
      const userExists = await models.User.findOne({ username: req.username });
      if (!userExists) {
        console.log(`Healing missing user: ${req.name} (${req.username})`);
        
        // Create the missing user record
        await new models.User({
          username: req.username,
          password: req.password,
          email: req.email,
          name: req.name,
          role: req.role,
          avatar_url: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png'
        }).save();
        
        console.log(`Successfully restored user account: ${req.username}`);
      } else {
        console.log(`User already exists for request: ${req.username}`);
      }
    }
    
    console.log("Database healing completed successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Migration Error:", err);
    process.exit(1);
  });
