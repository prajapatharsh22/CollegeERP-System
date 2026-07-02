const mongoose = require('mongoose');
const models = require('./models');

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_erp';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB.');
    initDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

const initDatabase = async () => {
  try {
    const userCount = await models.User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding MongoDB with initial data...');

      // 1. Seed Users
      const admin = await new models.User({
        username: 'harsh22',
        password: '12345678',
        email: 'hpboy221205@gmail.com',
        name: 'Harshvardhan Prajapat',
        role: 'Admin',
        avatar_url: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png'
      }).save();

      const mehta = await new models.User({
        username: 'mehta',
        password: 'faculty123',
        email: 'mehta@erp.com',
        name: 'Dr. Mehta',
        role: 'Faculty',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh'
      }).save();

      const sharma = await new models.User({
        username: 'sharma',
        password: 'faculty123',
        email: 'sharma@erp.com',
        name: 'Prof. Sharma',
        role: 'Faculty',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh'
      }).save();

      const kaur = await new models.User({
        username: 'kaur',
        password: 'faculty123',
        email: 'kaur@erp.com',
        name: 'Prof. Kaur',
        role: 'Faculty',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh'
      }).save();

      const verma = await new models.User({
        username: 'verma',
        password: 'faculty123',
        email: 'verma@erp.com',
        name: 'Dr. Verma',
        role: 'Faculty',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh'
      }).save();

      const student = await new models.User({
        username: 'harsh',
        password: 'student123',
        email: 'harsh@erp.com',
        name: 'Harsh Verma',
        role: 'Student',
        avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh'
      }).save();

      // 2. Seed Subjects
      const sub1 = await new models.Subject({ name: 'Data Structures', code: 'CS301', faculty_id: mehta._id, room: 'B-201' }).save();
      const sub2 = await new models.Subject({ name: 'Database Management', code: 'CS302', faculty_id: sharma._id, room: 'B-202' }).save();
      const sub3 = await new models.Subject({ name: 'Web Development', code: 'CS303', faculty_id: kaur._id, room: 'B-203' }).save();
      const sub4 = await new models.Subject({ name: 'Operating Systems', code: 'CS304', faculty_id: verma._id, room: 'B-204' }).save();

      // 3. Seed Timetable
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        await new models.Timetable({ subject_id: sub1._id, day_of_week: day, start_time: '09:00 AM', end_time: '10:00 AM' }).save();
        await new models.Timetable({ subject_id: sub2._id, day_of_week: day, start_time: '10:00 AM', end_time: '11:00 AM' }).save();
        await new models.Timetable({ subject_id: sub3._id, day_of_week: day, start_time: '12:00 PM', end_time: '01:00 PM' }).save();
        await new models.Timetable({ subject_id: sub4._id, day_of_week: day, start_time: '02:00 PM', end_time: '03:00 PM' }).save();
      }

      // 4. Seed Attendance (80% present)
      const attendanceDates = [
        '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19',
        '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26'
      ];
      const subjects = [sub1._id, sub2._id, sub3._id, sub4._id];
      for (const subId of subjects) {
        for (let i = 0; i < attendanceDates.length; i++) {
          const status = (i === 2 || i === 7) ? 'Absent' : 'Present';
          await new models.Attendance({ student_id: student._id, subject_id: subId, date: attendanceDates[i], status }).save();
        }
      }

      // 5. Seed Assignments
      const assign1 = await new models.Assignment({ title: 'Binary Trees Exercises', description: 'Solve tree traversal exercises given in PDF.', subject_id: sub1._id, due_date: '2026-07-05' }).save();
      const assign2 = await new models.Assignment({ title: 'Normalization Exercises', description: 'Normalize the relational schema to 3NF & BCNF.', subject_id: sub2._id, due_date: '2026-07-06' }).save();
      const assign3 = await new models.Assignment({ title: 'Portfolio Website HTML/CSS', description: 'Build a fully responsive portfolio using pure HTML and CSS.', subject_id: sub3._id, due_date: '2026-06-28' }).save();
      const assign4 = await new models.Assignment({ title: 'Process Scheduling Simulator', description: 'Write a program to simulate CPU scheduling algorithms like FCFS and SJF.', subject_id: sub4._id, due_date: '2026-07-10' }).save();

      // 6. Seed Submissions (Assignment 3 graded)
      await new models.Submission({ assignment_id: assign3._id, student_id: student._id, file_name: 'harsh_portfolio.zip', submitted_at: '2026-06-27 18:30:00', status: 'Graded', marks: 90 }).save();

      // 7. Seed Fees
      await new models.Fee({ student_id: student._id, amount_due: 45000, amount_paid: 45000, status: 'Paid', last_date: '2026-06-30' }).save();

      // 8. Seed Results
      await new models.Result({ student_id: student._id, subject_id: sub1._id, marks_obtained: 88, total_marks: 100, grade: 'A' }).save();
      await new models.Result({ student_id: student._id, subject_id: sub2._id, marks_obtained: 82, total_marks: 100, grade: 'A' }).save();
      await new models.Result({ student_id: student._id, subject_id: sub3._id, marks_obtained: 92, total_marks: 100, grade: 'O' }).save();
      await new models.Result({ student_id: student._id, subject_id: sub4._id, marks_obtained: 76, total_marks: 100, grade: 'B' }).save();

    }

    // Seed Notices if count is low (unconditional notices refresh)
    const noticeCount = await models.Notice.countDocuments();
    if (noticeCount < 5) {
      console.log('Refreshing database notices with realistic entries...');
      await models.Notice.deleteMany({});
      await new models.Notice({ title: 'Tomorrow is Holiday on account of Independence Day', content: 'All lectures are cancelled tomorrow. The college campus will remain closed.', category: 'General', created_at: '14 Aug 2024', posted_by: 'Admin' }).save();
      await new models.Notice({ title: 'Placement Drive by TCS on 20th Aug', content: 'TCS registration link is active. Eligible students can apply through the placement portal.', category: 'General', created_at: '13 Aug 2024', posted_by: 'Placement Cell' }).save();
      await new models.Notice({ title: 'Internal Exam Schedule Released', content: 'Mid-term exams will start from 25th September. Check department boards for details.', category: 'General', created_at: '12 Aug 2024', posted_by: 'Controller of Exams' }).save();
      await new models.Notice({ title: "Annual College Sports Meet 'SPOURYA 2026'", content: 'The annual sports festival will take place from July 15th to July 18th. Register for athletics, football, and cricket near the sports room.', category: 'Events', created_at: '29 Jun 2026', posted_by: 'Sports Coordinator' }).save();
      await new models.Notice({ title: 'Hackathon Registration Open: Smart India Hackathon', content: 'Smart India Hackathon registrations are now open. Team size: 6 students (minimum 1 female). Submit your ideas to Prof. Sharma before July 10th.', category: 'Academic', created_at: '28 Jun 2026', posted_by: 'Prof. Sharma' }).save();
      await new models.Notice({ title: 'Library Timing Extended for Final Exams', content: 'Starting tomorrow, the central library will remain open till 10:00 PM on weekdays to support exam preparation. Silent zone rules apply.', category: 'General', created_at: '27 Jun 2026', posted_by: 'Librarian' }).save();
      await new models.Notice({ title: 'Hostel Annual Fees Payment Deadline Extended', content: 'The deadline for paying hostel fees has been extended to July 10th. Fine of Rs 100/day will be charged after this date.', category: 'Urgent', created_at: '26 Jun 2026', posted_by: 'Hostel Warden' }).save();
    }

    // Reset student Harsh Verma's fee to Pending on startup for payment simulation
    const harshUser = await models.User.findOne({ username: 'harsh' });
    if (harshUser) {
      await models.Fee.findOneAndUpdate(
        { student_id: harshUser._id },
        { status: 'Pending', amount_paid: 0 }
      );
    }

    // Ensure old default 'admin' account is deleted (so only harsh22 remains)
    await models.User.deleteOne({ username: 'admin' });

    // Unconditional Super Admin Seeding for harsh22
    const existingAdmin = await models.User.findOne({ username: 'harsh22' });
    if (!existingAdmin) {
      console.log('Seeding missing Admin Super account (harsh22)...');
      await new models.User({
        username: 'harsh22',
        password: '12345678',
        email: 'hpboy221205@gmail.com',
        name: 'Harshvardhan Prajapat',
        role: 'Admin',
        avatar_url: 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png'
      }).save();
    } else {
      // Ensure credentials match user request
      existingAdmin.password = '12345678';
      existingAdmin.email = 'hpboy221205@gmail.com';
      existingAdmin.name = 'Harshvardhan Prajapat';
      existingAdmin.role = 'Admin';
      existingAdmin.avatar_url = 'https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png';
      await existingAdmin.save();
      console.log('Verified custom Super Admin account (harsh22) exists.');
    }

    // Force default placeholder avatars for all users to seed=harsh (Admin, Faculty, and Student)
    // preserving any custom base64/file uploads!
    await models.User.updateMany(
      { avatar_url: { $regex: /dicebear/ } },
      { avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh' }
    );

    // Unconditional Assignments Seeding for Data Structures (sub1 - Dr. Mehta's class)
    const dsSubject = await models.Subject.findOne({ name: 'Data Structures' });
    if (dsSubject) {
      const dsAssignCount = await models.Assignment.countDocuments({ subject_id: dsSubject._id });
      if (dsAssignCount < 6) {
        console.log('Refreshing Data Structures assignments list...');
        await models.Assignment.deleteMany({ subject_id: dsSubject._id });
        await new models.Assignment({ title: 'Binary Trees Exercises', description: 'Solve tree traversal exercises given in PDF.', subject_id: dsSubject._id, due_date: '2026-07-05' }).save();
        await new models.Assignment({ title: 'Graph Algorithms Implementation', description: 'Write a program to implement DFS and BFS traversal on a dynamic graph.', subject_id: dsSubject._id, due_date: '2026-07-08' }).save();
        await new models.Assignment({ title: 'Stack and Queue Applications', description: 'Implement infix-to-postfix expression converter using a stack data structure.', subject_id: dsSubject._id, due_date: '2026-07-12' }).save();
        await new models.Assignment({ title: 'Hashing and Collision Resolution', description: 'Solve hash index mapping using linear probing, quadratic probing, and chaining.', subject_id: dsSubject._id, due_date: '2026-07-15' }).save();
        await new models.Assignment({ title: 'Sorting Algorithm Analysis', description: 'Compare insertion sort, merge sort, and quicksort time complexities under random values.', subject_id: dsSubject._id, due_date: '2026-07-20' }).save();
        await new models.Assignment({ title: 'Red-Black Tree Visualizer Mock', description: 'Build a text-based representation showing black height balance constraints.', subject_id: dsSubject._id, due_date: '2026-07-25' }).save();
      }
    }

    // Unconditional Submissions Seeding for student Harsh Verma (Data Structures)
    if (harshUser && dsSubject) {
      const dsAssignments = await models.Assignment.find({ subject_id: dsSubject._id });
      const dsSubmissionsCount = await models.Submission.countDocuments({ student_id: harshUser._id });
      
      if (dsSubmissionsCount < 4 && dsAssignments.length >= 4) {
        console.log('Refreshing student dynamic submissions records...');
        await models.Submission.deleteMany({ student_id: harshUser._id });
        
        // 1. Binary Trees: Graded
        await new models.Submission({
          assignment_id: dsAssignments[0]._id,
          student_id: harshUser._id,
          file_name: 'harsh_binary_trees.zip',
          submitted_at: '2026-06-25 14:20:00',
          status: 'Graded',
          marks: 88
        }).save();

        // 2. Graph Algorithms: Pending
        await new models.Submission({
          assignment_id: dsAssignments[1]._id,
          student_id: harshUser._id,
          file_name: 'harsh_graph_impl.zip',
          submitted_at: '2026-06-28 10:15:00',
          status: 'Pending'
        }).save();

        // 3. Stack and Queue: Pending
        await new models.Submission({
          assignment_id: dsAssignments[2]._id,
          student_id: harshUser._id,
          file_name: 'harsh_stack_queue.zip',
          submitted_at: '2026-06-29 16:45:00',
          status: 'Pending'
        }).save();

        // 4. Hashing and Collision: Pending
        await new models.Submission({
          assignment_id: dsAssignments[3]._id,
          student_id: harshUser._id,
          file_name: 'harsh_hashing_collision.zip',
          submitted_at: '2026-06-30 11:30:00',
          status: 'Pending'
        }).save();
      }
    }

    console.log('MongoDB database seeded successfully!');
  } catch (err) {
    console.error('Error seeding MongoDB:', err);
  }
};

module.exports = mongoose.connection;
