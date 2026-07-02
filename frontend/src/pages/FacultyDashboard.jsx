import React, { useState, useEffect } from 'react';

const FacultyDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States for Profile Avatar Editor
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Live Presenter Simulator state
  const [simTime, setSimTime] = useState('Mon0930');

  // Form Modals states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark-theme')
  );

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark-theme')) {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  // Form Inputs states
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'Present' | 'Absent' }
  
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Class');

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/faculty/dashboard/${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
        
        // Setup initial attendance records (all empty/unmarked by default)
        if (result.studentsList) {
          const initialRecs = {};
          result.studentsList.forEach(st => {
            initialRecs[st.id] = '';
          });
          setAttendanceRecords(initialRecs);
        }
        
        if (result.classesList && result.classesList.length > 0) {
          // Default selection for forms
          setSelectedSubject(result.classesList[0].id);
        }
      } else {
        setError('Failed to fetch faculty data.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, [user.id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size is too large! Please choose an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result); // Save Base64 data URI string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpdate = async (e) => {
    e.preventDefault();
    if (!newAvatarUrl.trim()) return;
    setUpdatingAvatar(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarUrl: newAvatarUrl
        })
      });
      if (response.ok) {
        alert('Profile photo updated successfully!');
        setShowAvatarInput(false);
        setNewAvatarUrl('');
        fetchFacultyData(); // Reload profile details
      } else {
        alert('Failed to update profile photo.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating profile photo.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Submit Attendance Handler
  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSubject) {
      alert('Please select a subject.');
      return;
    }

    // Check if any student is still unmarked!
    const unmarkedCount = studentsList.filter(st => !attendanceRecords[st.id]).length;
    if (unmarkedCount > 0) {
      alert(`Please mark attendance (Present or Absent) for all students. ${unmarkedCount} student(s) are still unmarked.`);
      return;
    }

    const records = Object.keys(attendanceRecords).map(studentId => ({
      studentId: studentId,
      status: attendanceRecords[studentId]
    }));

    try {
      const response = await fetch('http://localhost:5000/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: attendanceDate,
          subjectId: selectedSubject,
          records
        })
      });

      if (response.ok) {
        alert('Attendance marked successfully!');
        setShowAttendanceModal(false);
        fetchFacultyData();
      } else {
        alert('Failed to save attendance.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating attendance.');
    }
  };

  // Create Assignment Handler
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDueDate) {
      alert('Please fill in required fields.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/assignments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignTitle,
          description: assignDesc,
          subjectId: selectedSubject,
          dueDate: assignDueDate
        })
      });

      if (response.ok) {
        alert('Assignment uploaded successfully!');
        setAssignTitle('');
        setAssignDesc('');
        setAssignDueDate('');
        setShowAssignmentModal(false);
        fetchFacultyData();
      } else {
        alert('Failed to create assignment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading assignment.');
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignment? This will also remove all student submissions for it.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/assignments/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        alert('Assignment deleted successfully!');
        fetchFacultyData();
      } else {
        alert('Failed to delete assignment.');
      }
    } catch(err) {
      console.error(err);
      alert('Error deleting assignment.');
    }
  };

  // Post Notice Handler
  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeDesc) {
      alert('Please fill notice details.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeDesc,
          category: noticeCategory,
          postedBy: user.name
        })
      });

      if (response.ok) {
        alert('Notice posted successfully!');
        setNoticeTitle('');
        setNoticeDesc('');
        setShowNoticeModal(false);
      } else {
        alert('Failed to post notice.');
      }
    } catch (err) {
      console.error(err);
      alert('Error posting notice.');
    }
  };

  // Grade Submission Handler
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (gradeMarks === '' || isNaN(gradeMarks)) {
      alert('Please enter valid marks.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/marks/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          marks: parseInt(gradeMarks)
        })
      });

      if (response.ok) {
        alert('Submission graded successfully!');
        setSelectedSubmission(null);
        setGradeMarks('');
        setShowGradeModal(false);
        fetchFacultyData();
      } else {
        alert('Failed to grade submission.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving grades.');
    }
  };

  const toggleAttendanceStatus = (studentId) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <h2>Loading Faculty Portal...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>{error}</h2>
        <button onClick={fetchFacultyData} className="btn-primary" style={{ marginTop: '1rem' }}>Retry Connection</button>
      </div>
    );
  }

  const {
    profile,
    totalClasses,
    totalStudents,
    avgAttendance,
    pendingAssignments,
    timetable,
    studentsList,
    assignmentsList,
    submissionsList,
    classesList
  } = data;

  const getFacultyEmpCode = (username) => {
    if (username === 'mehta') return 'EMP-CSE-101';
    if (username === 'sharma') return 'EMP-CSE-102';
    if (username === 'kaur') return 'EMP-ECE-103';
    if (username === 'verma') return 'EMP-ME-104';
    return `EMP-GEN-105`;
  };

  const getFacultyDept = (username) => {
    if (username === 'kaur') return 'Electronics & Comm. Engineering';
    if (username === 'verma') return 'Mechanical Engineering';
    return 'Computer Science & Engineering';
  };

  const getFacultyDesignation = (username) => {
    if (username === 'mehta') return 'Head of Department (HOD)';
    if (username === 'sharma') return 'Senior Professor';
    return 'Associate Professor';
  };

  const getFacultyJoinedDate = (username) => {
    if (username === 'mehta') return '15 July 2018';
    if (username === 'sharma') return '20 August 2020';
    if (username === 'kaur') return '10 January 2022';
    return '01 June 2021';
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <svg className="sidebar-logo-icon" viewBox="0 0 24 24" style={{ width: '28px', height: '28px', fill: 'var(--accent)' }}>
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              <path d="M4 11.23V17c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-5.77l-8 4.36-8-4.36z" />
            </svg>
            <span style={{ 
              fontSize: '1.15rem', 
              fontWeight: 800, 
              letterSpacing: '1px', 
              color: '#ffffff', 
              fontFamily: '"Outfit", "Inter", sans-serif'
            }}>
              campus<span style={{ color: 'var(--accent)' }}>Flow</span>
            </span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>

        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📊</span> Dashboard
          </li>
          <li className={`sidebar-item ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => { setActiveTab('classes'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🏫</span> My Classes
          </li>
          <li className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📅</span> Attendance Manager
          </li>
          <li className={`sidebar-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📝</span> Assignments List
          </li>
          <li className={`sidebar-item ${activeTab === 'grading' ? 'active' : ''}`} onClick={() => { setActiveTab('grading'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🖋️</span> Grade Submissions
          </li>
          <li className={`sidebar-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📢</span> Notices Manager
          </li>
          <li className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">👤</span> Profile
          </li>
        </ul>

        <div className="sidebar-logout">
          <div className="sidebar-item" onClick={onLogout} style={{ color: '#fda4af' }}>
            <span className="sidebar-icon">🚪</span> Logout
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
              ☰
            </button>
            <div className="header-logo">
              <svg className="sidebar-logo-icon" viewBox="0 0 24 24" style={{ width: '22px', height: '22px', fill: 'var(--accent)' }}>
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                <path d="M4 11.23V17c0 1.66 1.34 3 3 3h10c1.66 0 3-1.34 3-3v-5.77l-8 4.36-8-4.36z" />
              </svg>
              <span className="header-logo-text">
                campus<span style={{ color: 'var(--accent)' }}>Flow</span>
              </span>
            </div>
          </div>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme} 
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div 
              className="user-profile-menu" 
              onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} 
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              title="View Profile"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img className="avatar" src={profile.avatar_url} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
            </div>
          </div>
        </header>

        {/* Contents */}
        <main className="page-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome */}
              <div className="welcome-section">
                <h2>Welcome, {profile.name}! 👨‍🏫</h2>
                <p>Manage your classes and students efficiently.</p>
              </div>

              {/* Stats Cards */}
              <div className="cards-grid">
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">My Classes</span>
                    <span className="stat-card-value">{totalClasses}</span>
                    <span className="stat-card-subtext">Total Courses Assigned</span>
                  </div>
                  <div className="stat-card-icon-container blue">🏫</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Total Students</span>
                    <span className="stat-card-value">{totalStudents}</span>
                    <span className="stat-card-subtext">Under Instruction</span>
                  </div>
                  <div className="stat-card-icon-container green">👥</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Attendance Today</span>
                    <span className="stat-card-value">{avgAttendance}%</span>
                    <span className="stat-card-subtext">Average Daily Attendance</span>
                  </div>
                  <div className="stat-card-icon-container blue">📊</div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('grading')} style={{ cursor: 'pointer' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-label">Pending Grading</span>
                    <span className="stat-card-value">{pendingAssignments}</span>
                    <span className="stat-card-subtext">To Be Evaluated</span>
                  </div>
                  <div className="stat-card-icon-container orange">📝</div>
                </div>
              </div>

              {/* Layout splits: Timetable & Actions */}
              <div className="dashboard-grid">
                <div className="panel-card">
                  <h3>Today's Schedule</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Subject / Course</th>
                          <th>Lecture Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.map((slot, index) => (
                          <tr key={index}>
                            <td>{slot.start_time} - {slot.end_time}</td>
                            <td><strong>{slot.subject}</strong></td>
                            <td><span className="badge success">{slot.room}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="panel-card">
                  <h3>Quick Actions</h3>
                  <div className="quick-actions-panel" style={{ marginTop: '1.2rem' }}>
                    <button className="btn-action" onClick={() => setShowAttendanceModal(true)}>
                      <span style={{ fontSize: '1.5rem' }}>📅</span>
                      <span>Mark Attendance</span>
                    </button>
                    
                    <button className="btn-action" onClick={() => setShowAssignmentModal(true)}>
                      <span style={{ fontSize: '1.5rem' }}>📤</span>
                      <span>Upload Assignment</span>
                    </button>

                    <button className="btn-action" onClick={() => setShowNoticeModal(true)}>
                      <span style={{ fontSize: '1.5rem' }}>🔔</span>
                      <span>Post Notice</span>
                    </button>

                    <button className="btn-action" onClick={() => setActiveTab('grading')}>
                      <span style={{ fontSize: '1.5rem' }}>🖋️</span>
                      <span>Grade Submissions</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance chart line graph (SVG) */}
              <div className="panel-card">
                <h3>Weekly Class Attendance Trend</h3>
                <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                  <svg className="chart-svg" viewBox="0 0 600 220">
                    <defs>
                      <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid Lines */}
                    <line x1="50" y1="40" x2="550" y2="40" stroke="var(--border-color)" strokeDasharray="4 4" />
                    <line x1="50" y1="100" x2="550" y2="100" stroke="var(--border-color)" strokeDasharray="4 4" />
                    <line x1="50" y1="160" x2="550" y2="160" stroke="var(--border-color)" strokeDasharray="4 4" />
                    <line x1="50" y1="180" x2="550" y2="180" stroke="var(--border-color)" />

                    {/* Y Axis Labels */}
                    <text x="25" y="45" fill="var(--text-light)" fontSize="10">100%</text>
                    <text x="25" y="105" fill="var(--text-light)" fontSize="10">80%</text>
                    <text x="25" y="165" fill="var(--text-light)" fontSize="10">60%</text>

                    {/* Path & Fill Area */}
                    {/* Data Points: Mon: 90% (70px Y), Tue: 82% (94px Y), Wed: 95% (55px Y), Thu: 88% (76px Y), Fri: 93% (61px Y) */}
                    <path
                      d="M 50 180 L 50 70 L 175 94 L 300 55 L 425 76 L 550 61 L 550 180 Z"
                      fill="url(#gradient-area)"
                    />
                    <path
                      d="M 50 70 L 175 94 L 300 55 L 425 76 L 550 61"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="3"
                    />

                    {/* Dots */}
                    <circle cx="50" cy="70" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                    <circle cx="175" cy="94" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                    <circle cx="300" cy="55" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                    <circle cx="425" cy="76" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />
                    <circle cx="550" cy="61" r="5" fill="var(--accent)" stroke="#fff" strokeWidth="2" />

                    {/* X Axis Labels */}
                    <text x="40" y="205" fill="var(--text-light)" fontSize="11" fontWeight="500">Mon</text>
                    <text x="165" y="205" fill="var(--text-light)" fontSize="11" fontWeight="500">Tue</text>
                    <text x="290" y="205" fill="var(--text-light)" fontSize="11" fontWeight="500">Wed</text>
                    <text x="415" y="205" fill="var(--text-light)" fontSize="11" fontWeight="500">Thu</text>
                    <text x="540" y="205" fill="var(--text-light)" fontSize="11" fontWeight="500">Fri</text>
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* 1. Classes List Tab */}
          {activeTab === 'classes' && (
            <div>
              {/* Part 1: Assigned Courses Grid */}
              <div className="panel-card" style={{ marginBottom: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '1.2rem' }}>
                  <h3>My Assigned Courses</h3>
                  <span className="badge success" style={{ fontSize: '0.85rem' }}>Active Faculty Instruction</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  {(() => {
                    const uniqueSubjects = [];
                    const seen = new Set();
                    timetable.forEach(slot => {
                      if (!seen.has(slot.subject)) {
                        seen.add(slot.subject);
                        uniqueSubjects.push(slot);
                      }
                    });

                    return uniqueSubjects.map((sub, index) => (
                      <div 
                        key={index} 
                        className="card-item"
                        style={{ 
                          padding: '1.5rem', 
                          borderRadius: '10px', 
                          boxShadow: 'var(--shadow-sm)', 
                          backgroundColor: '#ffffff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          borderLeft: '5px solid var(--accent)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <span className="badge success" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              🟢 {sub.room}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              5 Days/Week
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem' }}>
                            {sub.subject}
                          </h4>

                          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 1.2rem 0' }}>
                            Instructional lectures covering core theoretical concepts, code reviews, and practical laboratory exercises.
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                          <span>Enrolled: <strong>{totalStudents} Students</strong></span>
                          <span>Dept: <strong>CSE</strong></span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>


              {/* Part 2: Weekly Schedule Planner */}
              <div className="panel-card" style={{ padding: '2rem' }}>
                <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                  <h3>Weekly Lecture Timeline</h3>
                  <span className="badge info" style={{ fontSize: '0.85rem' }}>Full Week At-A-Glance</span>
                </div>
                
                <div className="data-table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: '8px', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'transparent' }}>
                        <th style={{ backgroundColor: 'var(--bg-sidebar)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Time Slot</th>
                        <th style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Monday</th>
                        <th style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Tuesday</th>
                        <th style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Wednesday</th>
                        <th style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Thursday</th>
                        <th style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>Friday</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                          ⏰ 09:00 AM - 10:00 AM
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                          <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Mgmt</div>
                          <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Dev</div>
                          <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                          <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                          <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                          ⏰ 10:00 AM - 11:00 AM
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Mgmt</div>
                          <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                          <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                          <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Dev</div>
                          <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Mgmt</div>
                          <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                        </td>
                      </tr>

                      <tr style={{ backgroundColor: 'transparent' }}>
                        <td colSpan="6" style={{ padding: '0.4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                          ☕ 11:00 AM - 12:00 PM | Office Hours / Break
                        </td>
                      </tr>

                      <tr>
                        <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                          ⏰ 12:00 PM - 01:00 PM
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                          <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                          <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                          <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Mgmt</div>
                          <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                          <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                          ⏰ 02:00 PM - 03:00 PM
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                          <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Dev</div>
                          <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Mgmt</div>
                          <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                          <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                        </td>
                        <td style={{ backgroundColor: '#ffffff', padding: '1.2rem 1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                          <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Attendance Tab Page */}
          {activeTab === 'attendance' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Attendance Registry</h3>
              </div>
              
              <form onSubmit={handleMarkAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Select Course</label>
                    <select className="form-input" style={{ appearance: 'none', padding: '0.7rem' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                      {classesList && classesList.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Date</label>
                    <input type="date" className="form-input" style={{ padding: '0.7rem' }} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                  </div>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email ID</th>
                        <th style={{ textAlign: 'center' }}>Status (Present / Absent)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.map((student) => (
                        <tr key={student.id}>
                          <td style={{ verticalAlign: 'middle' }}><strong>{student.name}</strong></td>
                          <td style={{ verticalAlign: 'middle', color: 'var(--text-light)' }}>{student.email}</td>
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'Present' }))}
                                style={{
                                  padding: '0.45rem 1.2rem',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  backgroundColor: attendanceRecords[student.id] === 'Present' ? 'var(--success)' : 'transparent',
                                  color: attendanceRecords[student.id] === 'Present' ? '#ffffff' : 'var(--success)',
                                  border: '1.5px solid var(--success)'
                                }}
                              >
                                🟢 Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'Absent' }))}
                                style={{
                                  padding: '0.45rem 1.2rem',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  backgroundColor: attendanceRecords[student.id] === 'Absent' ? 'var(--danger)' : 'transparent',
                                  color: attendanceRecords[student.id] === 'Absent' ? '#ffffff' : 'var(--danger)',
                                  border: '1.5px solid var(--danger)'
                                }}
                              >
                                🔴 Absent
                              </button>
                              {!attendanceRecords[student.id] && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 500, marginLeft: '0.5rem', fontStyle: 'italic' }}>
                                  ⚠️ Unmarked
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.8rem 2rem' }}>
                  Save Attendance Registry
                </button>
              </form>
            </div>
          )}

          {/* 3. Assignments Tab Page */}
          {activeTab === 'assignments' && (
            <div>
              <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Assignments Manager</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                    Publish coursework, define learning objectives, and review students submissions.
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowAssignmentModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.4rem' }}>
                  ➕ Upload Assignment
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {assignmentsList.map((assign) => {
                  const isPastDue = new Date(assign.due_date) < new Date();
                  return (
                    <div 
                      key={assign.id}
                      className="card-item"
                      style={{ 
                        padding: '1.8rem', 
                        borderRadius: '12px', 
                        boxShadow: 'var(--shadow-sm)', 
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: isPastDue ? '5px solid #ef4444' : '5px solid var(--accent)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                    >
                      <div>
                        {/* Badges Row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span className="badge info" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            📖 {assign.subjectName}
                          </span>
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.72rem', 
                              fontWeight: 700, 
                              backgroundColor: isPastDue ? '#fef2f2' : '#ecfdf5',
                              color: isPastDue ? '#ef4444' : '#10b981',
                              border: isPastDue ? '1px solid #fee2e2' : '1px solid #d1fae5',
                              padding: '0.2rem 0.6rem'
                            }}
                          >
                            {isPastDue ? '🔴 Past Due' : '🟢 Active'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          📝 {assign.title}
                        </h4>

                        {/* Description */}
                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
                          {assign.description}
                        </p>
                      </div>

                      {/* Footer Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>DEADLINE</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isPastDue ? '#ef4444' : 'var(--bg-sidebar)' }}>
                            📅 {assign.due_date}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => setEditingAssignment(assign)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid #cbd5e1',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#cbd5e1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                            title="Edit Assignment Details"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAssignment(assign.id)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: '1px solid #fee2e2',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                            title="Delete Assignment"
                          >
                            🗑️ Delete
                          </button>
                          <button 
                            onClick={() => setActiveTab('grading')}
                            style={{
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                              color: 'var(--accent)',
                              border: '1.5px solid var(--accent)',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--accent)';
                            }}
                          >
                            🖋️ Grade
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Grading Tab Page */}
          {activeTab === 'grading' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Grade Submissions</h3>
              </div>

              <div className="data-table-container" style={{ marginTop: '1.5rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Assignment Title</th>
                      <th>File Uploaded</th>
                      <th>Submitted Time</th>
                      <th>Status</th>
                      <th>Grade (Marks)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsList.map((sub) => (
                      <tr key={sub.id}>
                        <td><strong>{sub.studentName}</strong></td>
                        <td>{sub.assignmentTitle}</td>
                        <td><a href="#" onClick={(e) => { e.preventDefault(); alert(`Downloading dummy file: ${sub.file_name}`); }} style={{ color: 'var(--accent)', fontWeight: 500 }}>📂 {sub.file_name}</a></td>
                        <td>{sub.submitted_at}</td>
                        <td>
                          <span className={`badge ${sub.status === 'Graded' ? 'success' : 'warning'}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          {sub.status === 'Graded' ? (
                            <strong>{sub.marks} / 100</strong>
                          ) : (
                            <button 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => { setSelectedSubmission(sub); setGradeMarks(''); setShowGradeModal(true); }}
                            >
                              Grade Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Profile Tab */}
          {activeTab === 'profile' && (
            <div className="panel-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '0', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
              {/* Top Banner Gradient */}
              <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--accent), var(--bg-sidebar))', position: 'relative' }}></div>
              
              {/* Profile Info Section */}
              <div style={{ padding: '2rem', textAlign: 'center', marginTop: '-70px', position: 'relative' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile Large" 
                    style={{ 
                      width: '130px', 
                      height: '130px', 
                      borderRadius: '50%', 
                      border: '5px solid #ffffff', 
                      boxShadow: 'var(--shadow-md)',
                      backgroundColor: '#ffffff',
                      objectFit: 'cover'
                    }} 
                  />
                  {/* Edit Icon Overlay */}
                  <button 
                    onClick={() => setShowAvatarInput(!showAvatarInput)}
                    style={{ 
                      position: 'absolute', 
                      bottom: '8px', 
                      right: '8px', 
                      backgroundColor: 'var(--accent)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '32px', 
                      height: '32px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Edit Avatar URL"
                  >
                    ✏️
                  </button>
                </div>

                {/* Inline Avatar Update Input */}
                {showAvatarInput && (
                  <form onSubmit={handleAvatarUpdate} style={{ maxWidth: '350px', margin: '1rem auto 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="form-input" 
                        style={{ padding: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }} 
                        onChange={handleFileChange}
                      />
                      <button type="submit" className="btn-primary" style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }} disabled={updatingAvatar || !newAvatarUrl}>
                        {updatingAvatar ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                    {newAvatarUrl && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 500 }}>
                        ✓ Image loaded. Click Save.
                      </span>
                    )}
                  </form>
                )}

                <h3 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '1rem' }}>{profile.name}</h3>
                <p style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '0.95rem', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Faculty Portal
                </p>
                
                {/* Profile details grid */}
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.8rem', backgroundColor: 'var(--bg-primary)', borderRadius: '12px', marginTop: '2rem' }}>
                  {/* Name Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      👤 Full Name
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.name}</span>
                  </div>

                  {/* Email Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ✉️ Email Address
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{profile.email}</span>
                  </div>

                  {/* Code Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🆔 Faculty Employee Code
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{getFacultyEmpCode(user.username)}</span>
                  </div>

                  {/* Department Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏫 Department
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{getFacultyDept(user.username)}</span>
                  </div>

                  {/* Designation Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      💼 Designation
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{getFacultyDesignation(user.username)}</span>
                  </div>

                  {/* Joined Date Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📅 Joined Date
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{getFacultyJoinedDate(user.username)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'notices' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Notices Board Manager</h3>
              </div>
              <FacultyNoticesManager noticesList={data.noticesList || []} profileName={profile.name} fetchFacultyData={fetchFacultyData} />
            </div>
          )}
        </main>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* 1. Mark Attendance Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Mark Lecture Attendance</h3>
              <button className="modal-close-btn" onClick={() => setShowAttendanceModal(false)}>❌</button>
            </div>
            
            <form onSubmit={handleMarkAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Course</label>
                  <select className="form-input" style={{ appearance: 'none', padding: '0.6rem' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    {classesList && classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Date</label>
                  <input type="date" className="form-input" style={{ padding: '0.6rem' }} value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} />
                </div>
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th style={{ textAlign: 'center' }}>Present?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((st) => (
                      <tr key={st.id}>
                        <td>{st.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            style={{ scale: '1.2', accentColor: 'var(--success)' }} 
                            checked={attendanceRecords[st.id] === 'Present'}
                            onChange={() => toggleAttendanceStatus(st.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowAttendanceModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Upload Assignment Modal */}
      {showAssignmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Upload Assignment Notice</h3>
              <button className="modal-close-btn" onClick={() => setShowAssignmentModal(false)}>❌</button>
            </div>
            
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Subject</label>
                <select className="form-input" style={{ appearance: 'none', padding: '0.6rem' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  {classesList && classesList.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  placeholder="e.g. Normalization Exercises"
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Instructions Description</label>
                <textarea 
                  className="form-input" 
                  style={{ padding: '0.6rem', height: '80px', resize: 'none' }}
                  placeholder="Enter details..."
                  value={assignDesc}
                  onChange={e => setAssignDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  value={assignDueDate}
                  onChange={e => setAssignDueDate(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Post Notice Modal */}
      {showNoticeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Post Department Announcement</h3>
              <button className="modal-close-btn" onClick={() => setShowNoticeModal(false)}>❌</button>
            </div>
            
            <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label>Notice Heading</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  placeholder="e.g. Lab Session Cancelled"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notice Category</label>
                <select className="form-input" style={{ appearance: 'none', padding: '0.6rem' }} value={noticeCategory} onChange={e => setNoticeCategory(e.target.value)}>
                  <option value="Class">Class Specific</option>
                  <option value="Faculty">Faculty Only</option>
                  <option value="General">General / All</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notice Content</label>
                <textarea 
                  className="form-input" 
                  style={{ padding: '0.6rem', height: '100px', resize: 'none' }}
                  placeholder="Enter content details..."
                  value={noticeDesc}
                  onChange={e => setNoticeDesc(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowNoticeModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Publish Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Grade Submission Modal */}
      {showGradeModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Evaluate Submission</h3>
              <button className="modal-close-btn" onClick={() => { setSelectedSubmission(null); setShowGradeModal(false); }}>❌</button>
            </div>
            
            <form onSubmit={handleGradeSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Student Name</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedSubmission.studentName}</div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>Assignment Title</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>{selectedSubmission.assignmentTitle}</div>
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.8rem' }}>Uploaded File</div>
                <div style={{ fontWeight: 600, color: 'var(--accent)', marginTop: '0.2rem' }}>{selectedSubmission.file_name}</div>
              </div>

              <div className="form-group">
                <label>Award Marks (Out of 100)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  placeholder="e.g. 85"
                  value={gradeMarks}
                  onChange={e => setGradeMarks(e.target.value)}
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => { setSelectedSubmission(null); setShowGradeModal(false); }}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Grade</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Assignment Modal */}
      {editingAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Assignment Details</h3>
              <button className="modal-close-btn" onClick={() => setEditingAssignment(null)}>❌</button>
            </div>
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const response = await fetch(`http://localhost:5000/api/assignments/${editingAssignment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: editingAssignment.title,
                      description: editingAssignment.description,
                      dueDate: editingAssignment.due_date
                    })
                  });
                  if (response.ok) {
                    alert('Assignment updated successfully!');
                    setEditingAssignment(null);
                    fetchFacultyData();
                  } else {
                    alert('Failed to update assignment.');
                  }
                } catch(err) {
                  console.error(err);
                  alert('Error updating assignment.');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
            >
              <div className="form-group">
                <label>Assignment Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  value={editingAssignment.title}
                  onChange={e => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Instructions Description</label>
                <textarea 
                  className="form-input" 
                  style={{ padding: '0.6rem', minHeight: '100px', resize: 'vertical' }} 
                  value={editingAssignment.description}
                  onChange={e => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  style={{ padding: '0.6rem' }} 
                  value={editingAssignment.due_date}
                  onChange={e => setEditingAssignment({ ...editingAssignment, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setEditingAssignment(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

const FacultyNoticesManager = ({ noticesList, profileName, fetchFacultyData }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, postedBy: `Dr. ${profileName}` })
      });

      if (response.ok) {
        setSuccess('Notice published successfully!');
        setTitle('');
        setContent('');
        setCategory('General');
        fetchFacultyData();
      } else {
        setError('Failed to publish notice.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchFacultyData();
      } else {
        alert('Failed to delete notice.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notices-manager-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
      {/* Publish Notice Form */}
      <div className="inner-card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>📢 Publish New Notice</h4>
        {error && <div className="error-message" style={{ margin: '1rem 0', color: 'var(--danger)' }}>{error}</div>}
        {success && <div className="success-message" style={{ margin: '1rem 0', backgroundColor: '#e6fffa', color: '#00875a', padding: '0.6rem', borderRadius: '6px', fontSize: '0.9rem' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Notice Title</label>
            <input 
              type="text" 
              placeholder="e.g. Extra Lab Session for DS" 
              className="form-input" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Category</label>
            <select 
              className="form-input" 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ padding: '0.6rem' }}
            >
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Exam">Exam</option>
              <option value="Placement">Placement</option>
              <option value="Event">Event</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontWeight: '500', fontSize: '0.9rem' }}>Notice Content</label>
            <textarea 
              placeholder="Enter detailed notice description..." 
              className="form-input" 
              rows="6" 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              required 
              style={{ resize: 'vertical', padding: '0.6rem' }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '0.5rem', cursor: 'pointer', padding: '0.7rem' }}>
            {submitting ? 'Publishing...' : 'Publish Notice'}
          </button>
        </form>
      </div>

      {/* Active Notices List */}
      <div className="inner-card" style={{ padding: '1.5rem', backgroundColor: 'var(--card-bg, #ffffff)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>📋 Active Notices ({noticesList.length})</h4>
        <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
          {noticesList.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>No notices published yet.</p>
          ) : (
            noticesList.map(notice => (
              <div key={notice.id} style={{ padding: '1rem', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '8px', position: 'relative', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ 
                    fontSize: '0.75rem', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    backgroundColor: notice.category === 'Exam' ? '#fee2e2' : notice.category === 'Placement' ? '#fef3c7' : '#e0e7ff',
                    color: notice.category === 'Exam' ? '#ef4444' : notice.category === 'Placement' ? '#d97706' : '#4f46e5',
                    fontWeight: '600'
                  }}>
                    {notice.category}
                  </span>
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                    title="Delete Notice"
                  >
                    🗑️
                  </button>
                </div>
                <h5 style={{ margin: '0 0 0.3rem 0', color: '#1e293b', fontWeight: '600' }}>{notice.title}</h5>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 0.6rem 0', whiteSpace: 'pre-line' }}>{notice.content}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #edf2f7', paddingTop: '0.4rem' }}>
                  <span>Posted by: {notice.posted_by}</span>
                  <span>{notice.created_at}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
