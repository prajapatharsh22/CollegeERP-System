const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Faculty', 'Admin'], required: true },
  avatar_url: { type: String }
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: String, required: true }
});

const timetableSchema = new mongoose.Schema({
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  day_of_week: { type: String, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true }
});

const attendanceSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['Present', 'Absent'], required: true }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  due_date: { type: String, required: true }
});

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  file_name: { type: String, required: true },
  submitted_at: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Graded'], default: 'Pending' },
  marks: { type: Number }
});

const feeSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount_due: { type: Number, required: true },
  amount_paid: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending'], required: true },
  last_date: { type: String, required: true }
});

const resultSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  marks_obtained: { type: Number, required: true },
  total_marks: { type: Number, required: true },
  grade: { type: String, required: true }
});

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true }, // General, Faculty, Class
  created_at: { type: String, required: true },
  posted_by: { type: String, required: true }
});

const registrationRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Faculty'], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  created_at: { type: String, required: true }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Timetable: mongoose.model('Timetable', timetableSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  Assignment: mongoose.model('Assignment', assignmentSchema),
  Submission: mongoose.model('Submission', submissionSchema),
  Fee: mongoose.model('Fee', feeSchema),
  Result: mongoose.model('Result', resultSchema),
  Notice: mongoose.model('Notice', noticeSchema),
  RegistrationRequest: mongoose.model('RegistrationRequest', registrationRequestSchema)
};
