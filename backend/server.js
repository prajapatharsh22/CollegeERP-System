const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dbHelper = require('./database'); // Runs connection logic
const models = require('./models');
const emailService = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper helper to format Mongo ObjectIds safely for Frontend
const toId = (objId) => objId ? objId.toString() : '';

// ----------------------------------------------------
// 1. AUTH API
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await models.User.findOne({
      username: username.toLowerCase().trim(),
      password,
      role
    });

    if (user) {
      // Dispatch security login alert asynchronously in background
      if (user.email) {
        emailService.sendLoginNotification(user.email, user.name, user.role).catch(err => {
          console.error('Login email alert background error:', err.message);
        });
      }

      res.json({
        id: toId(user._id),
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      });
    } else {
      res.status(401).json({ error: 'Invalid username, password or role' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error occurred' });
  }
});

// Auth Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { identity, newPassword } = req.body;
  if (!identity || !newPassword) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const trimmedIdentity = identity.toLowerCase().trim();
    // Search by username or email
    const user = await models.User.findOne({
      $or: [
        { username: trimmedIdentity },
        { email: trimmedIdentity }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found with this username or email' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully in database!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password in database' });
  }
});

// ----------------------------------------------------
// 2. STUDENT DASHBOARD API
// ----------------------------------------------------
app.get('/api/student/dashboard/:studentId', async (req, res) => {
  const { studentId } = req.params;

  try {
    // A. Profile
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const profile = await models.User.findById(studentId);
    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // B. Attendance overall stats
    const totalAttendance = await models.Attendance.countDocuments({ student_id: studentId });
    const presentAttendance = await models.Attendance.countDocuments({ student_id: studentId, status: 'Present' });
    const overallAttendance = totalAttendance > 0 
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : 0;

    // C. Subject-wise Attendance
    const subjectsList = await models.Subject.find();
    const subjectAttendance = [];
    for (const sub of subjectsList) {
      const total = await models.Attendance.countDocuments({ student_id: studentId, subject_id: sub._id });
      const present = await models.Attendance.countDocuments({ student_id: studentId, subject_id: sub._id, status: 'Present' });
      subjectAttendance.push({
        subjectName: sub.name,
        subjectCode: sub.code,
        present,
        total
      });
    }

    // D. Pending Assignments
    const totalAssignments = await models.Assignment.countDocuments();
    const submittedCount = await models.Submission.countDocuments({ student_id: studentId });
    const pendingSubmissions = Math.max(0, totalAssignments - submittedCount);

    const assigns = await models.Assignment.find().populate('subject_id').sort({ due_date: 1 });
    const assignmentsList = [];
    for (const a of assigns) {
      const sub = await models.Submission.findOne({ assignment_id: a._id, student_id: studentId });
      assignmentsList.push({
        id: toId(a._id),
        title: a.title,
        description: a.description,
        due_date: a.due_date,
        subjectName: a.subject_id ? a.subject_id.name : 'General',
        submissionStatus: sub ? sub.status : null,
        marks: sub ? sub.marks : null
      });
    }

    // E. Fee Status
    const fee = await models.Fee.findOne({ student_id: studentId });
    const feeStatus = fee ? {
      amount_due: fee.amount_due,
      amount_paid: fee.amount_paid,
      status: fee.status,
      last_date: fee.last_date
    } : { amount_due: 45000, amount_paid: 0, status: 'Pending', last_date: 'N/A' };

    // F. Results
    const results = await models.Result.find({ student_id: studentId }).populate('subject_id');
    const gradesList = results.map(r => ({
      marks_obtained: r.marks_obtained,
      total_marks: r.total_marks,
      grade: r.grade,
      subjectName: r.subject_id ? r.subject_id.name : 'Unknown',
      subjectCode: r.subject_id ? r.subject_id.code : 'Unknown'
    }));
    
    // G. Timetable
    const tt = await models.Timetable.find().populate({ path: 'subject_id', populate: { path: 'faculty_id' } });
    const timetable = tt.map(t => ({
      subject: t.subject_id ? t.subject_id.name : 'Class',
      room: t.subject_id ? t.subject_id.room : 'N/A',
      faculty: (t.subject_id && t.subject_id.faculty_id) ? t.subject_id.faculty_id.name : 'Faculty',
      start_time: t.start_time,
      end_time: t.end_time
    }));

    // H. Notices
    const notices = await models.Notice.find().sort({ _id: -1 }).limit(10);
    const noticesList = notices.map(n => ({
      id: toId(n._id),
      title: n.title,
      content: n.content,
      category: n.category,
      created_at: n.created_at,
      posted_by: n.posted_by
    }));

    res.json({
      profile: {
        id: toId(profile._id),
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatar_url: profile.avatar_url
      },
      overallAttendance,
      subjectAttendance,
      pendingSubmissions,
      assignmentsList,
      feeStatus,
      cgpa: 8.45,
      pastResults: [
        {
          semester: "1st Semester",
          sgpa: 8.20,
          subjects: [
            { code: "MA101", name: "Engineering Mathematics-I", marks: 85, total: 100, grade: "A" },
            { code: "PH101", name: "Engineering Physics", marks: 78, total: 100, grade: "B" },
            { code: "EE101", name: "Basic Electrical Engineering", marks: 92, total: 100, grade: "O" },
            { code: "CS101", name: "Introduction to Programming", marks: 88, total: 100, grade: "A" }
          ]
        },
        {
          semester: "2nd Semester",
          sgpa: 8.50,
          subjects: [
            { code: "MA102", name: "Engineering Mathematics-II", marks: 88, total: 100, grade: "A" },
            { code: "CH101", name: "Engineering Chemistry", marks: 84, total: 100, grade: "A" },
            { code: "ME101", name: "Engineering Mechanics", marks: 80, total: 100, grade: "A" },
            { code: "CS102", name: "Object Oriented Programming", marks: 95, total: 100, grade: "O" }
          ]
        },
        {
          semester: "3rd Semester",
          sgpa: 8.35,
          subjects: [
            { code: "CS201", name: "Discrete Mathematics", marks: 82, total: 100, grade: "A" },
            { code: "CS202", name: "Digital Logic Design", marks: 86, total: 100, grade: "A" },
            { code: "CS203", name: "Computer Organization", marks: 78, total: 100, grade: "B" },
            { code: "CS204", name: "Data Communication", marks: 90, total: 100, grade: "O" }
          ]
        },
        {
          semester: "4th Semester",
          sgpa: 8.75,
          subjects: [
            { code: "CS205", name: "Theory of Computation", marks: 89, total: 100, grade: "A" },
            { code: "CS206", name: "Design & Analysis of Algorithms", marks: 94, total: 100, grade: "O" },
            { code: "CS207", name: "Software Engineering", marks: 85, total: 100, grade: "A" },
            { code: "CS208", name: "Microprocessors", marks: 81, total: 100, grade: "A" }
          ]
        }
      ],
      gradesList,
      timetable,
      noticesList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ----------------------------------------------------
// 3. FACULTY DASHBOARD API
// ----------------------------------------------------
app.get('/api/faculty/dashboard/:facultyId', async (req, res) => {
  const { facultyId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: 'Invalid faculty ID' });
    }
    const profile = await models.User.findById(facultyId);
    if (!profile) return res.status(404).json({ error: 'Faculty not found' });

    // A. Classes Count
    const classes = await models.Subject.find({ faculty_id: facultyId });
    const totalClasses = classes.length;

    // B. Total Students
    const totalStudents = await models.User.countDocuments({ role: 'Student' });

    // C. Avg Attendance
    const classIds = classes.map(c => c._id);
    const totalAttRecords = await models.Attendance.countDocuments({ subject_id: { $in: classIds } });
    const presentAttRecords = await models.Attendance.countDocuments({ subject_id: { $in: classIds }, status: 'Present' });
    const avgAttendance = totalAttRecords > 0
      ? Math.round((presentAttRecords / totalAttRecords) * 100)
      : 93;

    // D. Pending Grading
    const assigns = await models.Assignment.find({ subject_id: { $in: classIds } });
    const assignIds = assigns.map(a => a._id);
    const pendingAssignments = await models.Submission.countDocuments({
      assignment_id: { $in: assignIds },
      status: 'Pending'
    });

    // E. Today's Schedule
    const tt = await models.Timetable.find({ subject_id: { $in: classIds } }).populate('subject_id');
    const timetable = tt.map(t => ({
      subject: t.subject_id ? t.subject_id.name : 'Course',
      room: t.subject_id ? t.subject_id.room : 'N/A',
      start_time: t.start_time,
      end_time: t.end_time
    }));

    // F. Students List
    const students = await models.User.find({ role: 'Student' });
    const studentsList = students.map(s => ({
      id: toId(s._id),
      name: s.name,
      username: s.username,
      email: s.email
    }));

    // G. Assignments List
    const assignmentsList = assigns.map(a => ({
      id: toId(a._id),
      title: a.title,
      description: a.description || 'Assignment issued under course code.',
      due_date: a.due_date,
      subjectName: classes.find(c => c._id.toString() === a.subject_id.toString())?.name || 'My Subject'
    }));

    // H. Submissions List
    const subs = await models.Submission.find({ assignment_id: { $in: assignIds } }).populate('student_id').populate('assignment_id');
    const submissionsList = subs.map(s => ({
      id: toId(s._id),
      file_name: s.file_name,
      submitted_at: s.submitted_at,
      status: s.status,
      marks: s.marks,
      studentName: s.student_id ? s.student_id.name : 'Student',
      studentId: s.student_id ? toId(s.student_id._id) : '',
      assignmentTitle: s.assignment_id ? s.assignment_id.title : 'Assignment',
      assignmentId: s.assignment_id ? toId(s.assignment_id._id) : ''
    }));

    const classesList = classes.map(c => ({
      id: toId(c._id),
      name: c.name,
      code: c.code
    }));

    // Fetch notices board
    const notices = await models.Notice.find().sort({ _id: -1 });
    const noticesList = notices.map(n => ({
      id: toId(n._id),
      title: n.title,
      content: n.content,
      category: n.category,
      created_at: n.created_at,
      posted_by: n.posted_by
    }));

    res.json({
      profile: {
        id: toId(profile._id),
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatar_url: profile.avatar_url
      },
      totalClasses,
      totalStudents,
      avgAttendance,
      pendingAssignments,
      timetable,
      studentsList,
      assignmentsList,
      submissionsList,
      classesList,
      noticesList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ----------------------------------------------------
// 4. ADMIN DASHBOARD API
// ----------------------------------------------------
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalStudents = await models.User.countDocuments({ role: 'Student' });
    const totalFaculty = await models.User.countDocuments({ role: 'Faculty' });
    const totalCourses = await models.Subject.countDocuments();
    
    const feesList = await models.Fee.find();
    const totalRevenue = feesList.reduce((sum, f) => sum + f.amount_paid, 0);

    const attendanceTrends = [
      { month: 'Jan', percentage: 70 },
      { month: 'Feb', percentage: 75 },
      { month: 'Mar', percentage: 80 },
      { month: 'Apr', percentage: 78 },
      { month: 'May', percentage: 84 },
      { month: 'Jun', percentage: 82 }
    ];

    const topCourses = [
      { name: 'Computer Science', students: 945 },
      { name: 'Information Technology', students: 632 },
      { name: 'Electronics & Communication', students: 521 }
    ];

    const recentActivities = [
      { id: 1, type: 'registration', message: 'New Student Registered: Rahul Kumar', time: '2 mins ago' },
      { id: 2, type: 'assignment', message: 'Assignment Posted in Web Development', time: '15 mins ago' },
      { id: 3, type: 'fees', message: 'Fees Payment Received from Ankit Singh', time: '45 mins ago' },
      { id: 4, type: 'attendance', message: 'Attendance Marked for CS301 by Dr. Mehta', time: '1 hour ago' }
    ];

    // Fetch pending registration requests
    const pendingReqs = await models.RegistrationRequest.find({ status: 'Pending' }).sort({ _id: -1 });
    const requestsList = pendingReqs.map(r => ({
      id: toId(r._id),
      name: r.name,
      email: r.email,
      username: r.username,
      role: r.role,
      created_at: r.created_at
    }));

    // Fetch all notices board dynamically
    const notices = await models.Notice.find().sort({ _id: -1 });
    const noticesList = notices.map(n => ({
      id: toId(n._id),
      title: n.title,
      content: n.content,
      category: n.category,
      created_at: n.created_at,
      posted_by: n.posted_by
    }));

    res.json({
      totalStudents,
      totalFaculty,
      totalCourses,
      totalRevenue,
      targetRevenue: 3300000,
      attendanceTrends,
      topCourses,
      recentActivities,
      requestsList,
      noticesList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server database error' });
  }
});

// ----------------------------------------------------
// 5. ACTION APIs
// ----------------------------------------------------

// A. Mark Attendance
app.post('/api/attendance/mark', async (req, res) => {
  const { date, subjectId, records } = req.body;
  
  if (!date || !subjectId || !records || !records.length) {
    return res.status(400).json({ error: 'Missing date, subjectId or records' });
  }

  try {
    for (const record of records) {
      await models.Attendance.findOneAndUpdate(
        {
          student_id: record.studentId,
          subject_id: subjectId,
          date
        },
        { status: record.status },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// B. Post Assignment
app.post('/api/assignments/create', async (req, res) => {
  const { title, description, subjectId, dueDate } = req.body;
  if (!title || !subjectId || !dueDate) {
    return res.status(400).json({ error: 'Title, Subject and Due Date are required' });
  }

  try {
    await new models.Assignment({
      title,
      description: description || '',
      subject_id: subjectId,
      due_date: dueDate
    }).save();

    res.json({ success: true, message: 'Assignment created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// C. Submit Assignment
app.post('/api/assignments/submit', async (req, res) => {
  const { assignmentId, studentId, fileName } = req.body;
  if (!assignmentId || !studentId || !fileName) {
    return res.status(400).json({ error: 'Missing submission fields' });
  }

  try {
    const today = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    await models.Submission.findOneAndUpdate(
      {
        assignment_id: assignmentId,
        student_id: studentId
      },
      {
        file_name: fileName,
        submitted_at: today,
        status: 'Pending'
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database submit failed' });
  }
});

// D. Grade Submission
app.post('/api/marks/grade', async (req, res) => {
  const { submissionId, marks } = req.body;
  if (!submissionId || marks === undefined) {
    return res.status(400).json({ error: 'Missing submissionId or marks' });
  }

  try {
    const sub = await models.Submission.findByIdAndUpdate(
      submissionId,
      { marks: parseInt(marks), status: 'Graded' },
      { new: true }
    );

    if (sub) {
      const assign = await models.Assignment.findById(sub.assignment_id);
      if (assign) {
        const grade = marks >= 90 ? 'O' : marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : 'F';
        
        await models.Result.findOneAndUpdate(
          {
            student_id: sub.student_id,
            subject_id: assign.subject_id
          },
          {
            marks_obtained: parseInt(marks),
            total_marks: 100,
            grade
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json({ success: true, message: 'Submission graded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database grade failed' });
  }
});

// E. Add User (Admin Action)
app.post('/api/users/create', async (req, res) => {
  const { username, password, email, name, role } = req.body;
  if (!username || !password || !email || !name || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Fetch default avatar dynamically from Harsh Verma's current database profile
    let defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh';
    const harsh = await models.User.findOne({ username: 'harsh' });
    if (harsh && harsh.avatar_url) {
      defaultAvatar = harsh.avatar_url;
    }

    const newUser = await new models.User({
      username: username.toLowerCase().trim(),
      password,
      email,
      name,
      role,
      avatar_url: defaultAvatar
    }).save();

    if (role === 'Student') {
      await new models.Fee({
        student_id: newUser._id,
        amount_due: 45000,
        amount_paid: 0,
        status: 'Pending',
        last_date: '2026-07-31'
      }).save();
    }

    res.json({ success: true, message: 'User created successfully', userId: toId(newUser._id) });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Database user insert failed' });
  }
});

// F. Post Notice
app.post('/api/notices/create', async (req, res) => {
  const { title, content, category, postedBy } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, Content and Category are required' });
  }

  try {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    await new models.Notice({
      title,
      content,
      category,
      created_at: today,
      posted_by: postedBy || 'Admin'
    }).save();

    res.json({ success: true, message: 'Notice posted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database notice insert failed' });
  }
});

// G. Submit Self Registration Request
app.post('/api/requests/create', async (req, res) => {
  const { name, email, username, password, role } = req.body;
  if (!name || !email || !username || !password || !role) {
    return res.status(400).json({ error: 'All registration request fields are required' });
  }

  try {
    // Check if user already exists in main collection
    const userExists = await models.User.findOne({ username: username.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ error: 'Username is already taken and registered' });
    }

    // Check if there is an active pending request
    const requestExists = await models.RegistrationRequest.findOne({ 
      username: username.toLowerCase().trim(),
      status: 'Pending'
    });
    if (requestExists) {
      return res.status(400).json({ error: 'A pending registration request already exists for this username' });
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    await new models.RegistrationRequest({
      name,
      email,
      username: username.toLowerCase().trim(),
      password,
      role,
      created_at: today
    }).save();

    res.json({ success: true, message: 'Registration request submitted successfully to Admin!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit registration request' });
  }
});

// H. Approve/Reject Request (Admin Action)
app.post('/api/requests/action', async (req, res) => {
  const { requestId, action } = req.body; // action: 'Approve' or 'Reject'
  if (!requestId || !action) {
    return res.status(400).json({ error: 'Missing requestId or action' });
  }

  try {
    const reqDoc = await models.RegistrationRequest.findById(requestId);
    if (!reqDoc) {
      return res.status(404).json({ error: 'Registration request not found' });
    }

    if (action === 'Approve') {
      // Fetch default avatar dynamically from Harsh Verma's current database profile
      let defaultAvatar = 'https://api.dicebear.com/7.x/adventurer/svg?seed=harsh';
      const harsh = await models.User.findOne({ username: 'harsh' });
      if (harsh && harsh.avatar_url) {
        defaultAvatar = harsh.avatar_url;
      }

      // Create user entry
      const newUser = await new models.User({
        username: reqDoc.username,
        password: reqDoc.password,
        email: reqDoc.email,
        name: reqDoc.name,
        role: reqDoc.role,
        avatar_url: defaultAvatar
      }).save();

      // Seed student specific parameters
      if (reqDoc.role === 'Student') {
        await new models.Fee({
          student_id: newUser._id,
          amount_due: 45000,
          amount_paid: 0,
          status: 'Pending',
          last_date: '2026-07-31'
        }).save();
      }

      reqDoc.status = 'Approved';
    } else if (action === 'Reject') {
      reqDoc.status = 'Rejected';
    }

    await reqDoc.save();
    res.json({ success: true, message: `Request successfully ${action}d!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// I. Get Active Login Hints dynamically from Database
app.get('/api/auth/hints', async (req, res) => {
  try {
    const student = await models.User.findOne({ role: 'Student' });
    const faculty = await models.User.findOne({ role: 'Faculty' });
    const admin = await models.User.findOne({ role: 'Admin' });

    res.json({
      student: student ? `${student.username} / ${student.password}` : 'None',
      faculty: faculty ? `${faculty.username} / ${faculty.password}` : 'None',
      admin: admin ? `${admin.username} / ${admin.password}` : 'None'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hints' });
  }
});

// J. Reset Password Endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  const { identity, newPassword } = req.body;
  if (!identity || !newPassword) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  try {
    const user = await models.User.findOne({
      $or: [
        { username: identity.toLowerCase().trim() },
        { email: identity.toLowerCase().trim() }
      ]
    });

    if (user) {
      user.password = newPassword;
      await user.save();
      res.json({ success: true, message: 'Password updated successfully!' });
    } else {
      res.status(404).json({ error: 'User with this username or email not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database update failed' });
  }
});

// K. Update User Avatar Endpoint
app.post('/api/users/update-avatar', async (req, res) => {
  const { userId, avatarUrl } = req.body;
  if (!userId || !avatarUrl) {
    return res.status(400).json({ error: 'User ID and Avatar URL are required' });
  }

  try {
    await models.User.findByIdAndUpdate(userId, { avatar_url: avatarUrl });
    res.json({ success: true, message: 'Profile photo updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// L. Pay Student Fee Endpoint
app.post('/api/student/pay-fee', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  try {
    const fee = await models.Fee.findOneAndUpdate(
      { student_id: studentId },
      { status: 'Paid', amount_paid: 45000 },
      { new: true }
    );
    if (fee) {
      res.json({ success: true, message: 'Fee paid successfully!', fee });
    } else {
      res.status(404).json({ error: 'Fee record not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// M. Delete Assignment Endpoint
app.delete('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await models.Assignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    // Delete any submissions associated with this assignment
    await models.Submission.deleteMany({ assignment_id: id });
    res.json({ success: true, message: 'Assignment and related submissions deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// N. Update Assignment Endpoint
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate } = req.body;
  if (!title || !dueDate) {
    return res.status(400).json({ error: 'Title and Due Date are required' });
  }

  try {
    const updated = await models.Assignment.findByIdAndUpdate(
      id,
      { title, description: description || '', due_date: dueDate },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json({ success: true, message: 'Assignment updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// O. Delete Notice Endpoint
app.delete('/api/notices/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await models.Notice.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json({ success: true, message: 'Notice deleted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
