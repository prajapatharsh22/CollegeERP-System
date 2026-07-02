const mongoose = require('mongoose');
const models = require('./models');

mongoose.connect('mongodb://127.0.0.1:27017/college_erp')
  .then(async () => {
    const inputEmail = 'rohit123@gmail.com';
    const inputPassword = '2212';
    const inputRole = 'Student';

    console.log("Input email:", JSON.stringify(inputEmail));
    console.log("Input password:", JSON.stringify(inputPassword));
    console.log("Input role:", JSON.stringify(inputRole));

    const user = await models.User.findOne({ email: inputEmail });
    if (!user) {
      console.log("Diagnostic: User NOT found by email!");
      const allUsers = await models.User.find({});
      console.log("All users list in DB:", JSON.stringify(allUsers, null, 2));
    } else {
      console.log("Diagnostic: User FOUND by email!");
      console.log("DB User:", JSON.stringify(user, null, 2));
      console.log("Password match:", user.password === inputPassword, `| DB: "${user.password}" vs Input: "${inputPassword}"`);
      console.log("Role match:", user.role === inputRole, `| DB: "${user.role}" vs Input: "${inputRole}"`);
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
