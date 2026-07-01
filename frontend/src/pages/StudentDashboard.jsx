import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States for interactive features
  const [submittingId, setSubmittingId] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [payingFee, setPayingFee] = useState(false);

  // States for Profile Avatar Editor
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  // Results Semester Dropdown state
  const [expandedSem, setExpandedSem] = useState(null);
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://collegeerp-system.onrender.com/api/student/dashboard/${user.id}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError('Failed to fetch dashboard data.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch('https://collegeerp-system.onrender.com/api/users/update-avatar', {
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
        fetchDashboardData(); // Reload profile details
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

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const handleAssignmentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFileName(file.name);
    }
  };

  const handleAssignmentSubmit = async (assignmentId) => {
    if (!uploadFileName.trim()) {
      alert('Please select a file from your file explorer to submit.');
      return;
    }

    try {
      const response = await fetch('https://collegeerp-system.onrender.com/api/assignments/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          studentId: user.id,
          fileName: uploadFileName
        })
      });

      if (response.ok) {
        alert('Assignment submitted successfully!');
        setSubmittingId(null);
        setUploadFileName('');
        fetchDashboardData(); // Refresh metrics
      } else {
        alert('Failed to submit assignment.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting assignment.');
    }
  };

  const handlePayFee = async () => {
    setPayingFee(true);
    // Simulate gateway response delay
    setTimeout(async () => {
      try {
        const response = await fetch('https://collegeerp-system.onrender.com/api/student/pay-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: user.id })
        });
        if (response.ok) {
          alert('Payment of ₹45,000 completed successfully through MERN billing gateway!');
          setShowFeeModal(false);
          fetchDashboardData(); // Reload fee state dynamically
        } else {
          alert('Payment processing failed on server.');
        }
      } catch (err) {
        console.error(err);
        alert('Payment processing network error.');
      } finally {
        setPayingFee(false);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <h2>Loading Student Portal...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>{error}</h2>
        <button onClick={fetchDashboardData} className="btn-primary" style={{ marginTop: '1rem' }}>Retry Connection</button>
      </div>
    );
  }

  const {
    profile,
    overallAttendance,
    subjectAttendance,
    pendingSubmissions,
    assignmentsList,
    feeStatus,
    cgpa,
    gradesList,
    timetable,
    noticesList,
    pastResults
  } = data;

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
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
          <li className={`sidebar-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📅</span> Attendance
          </li>
          <li className={`sidebar-item ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => { setActiveTab('timetable'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🗓️</span> Timetable
          </li>
          <li className={`sidebar-item ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📝</span> Assignments
          </li>
          <li className={`sidebar-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🔔</span> Notices
          </li>
          <li className={`sidebar-item ${activeTab === 'results' ? 'active' : ''}`} onClick={() => { setActiveTab('results'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🎓</span> Results
          </li>
          <li className={`sidebar-item ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => { setActiveTab('fees'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">💳</span> Fees
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

      {/* Main Content Area */}
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

        {/* Dynamic Pages depending on active tab */}
        <main className="page-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="welcome-section">
                <h2>Welcome back, {profile.name}! 👋</h2>
                <p>Here's what's happening with your academics.</p>
              </div>

              {/* Stats row */}
              <div className="cards-grid">
                {/* Attendance Card */}
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Attendance</span>
                    <span className="stat-card-value">{overallAttendance}%</span>
                    <span className="stat-card-subtext">Overall Attendance</span>
                  </div>
                  <div className="stat-card-icon-container blue">📊</div>
                </div>

                {/* Assignments Card */}
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Assignments</span>
                    <span className="stat-card-value">{pendingSubmissions}</span>
                    <span className="stat-card-subtext">Pending Submissions</span>
                  </div>
                  <div className="stat-card-icon-container orange">📝</div>
                </div>

                {/* Fees Status Card */}
                <div className="stat-card" onClick={() => setActiveTab('fees')} style={{ cursor: 'pointer' }}>
                  <div className="stat-card-info">
                    <span className="stat-card-label">Fees Status</span>
                    <span className="stat-card-value" style={{ color: feeStatus.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>
                      {feeStatus.status}
                    </span>
                    <span className="stat-card-subtext">All dues status</span>
                  </div>
                  <div className="stat-card-icon-container green">💳</div>
                </div>

                {/* CGPA Card */}
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">CGPA</span>
                    <span className="stat-card-value">{cgpa}</span>
                    <span className="stat-card-subtext">Current CGPA</span>
                  </div>
                  <div className="stat-card-icon-container blue">🎓</div>
                </div>
              </div>

              {/* Grid: Timetable & Notices */}
              <div className="dashboard-grid">
                {/* Classes Today */}
                <div className="panel-card">
                  <h3>Today's Classes</h3>
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Subject</th>
                          <th>Room</th>
                          <th>Faculty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetable.slice(0, 4).map((slot, index) => (
                          <tr key={index}>
                            <td>{slot.start_time} - {slot.end_time}</td>
                            <td><strong>{slot.subject}</strong></td>
                            <td><span className="badge warning">{slot.room}</span></td>
                            <td>{slot.faculty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Notices */}
                <div className="panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Recent Notices</h3>
                    <span className="view-all-link" onClick={() => setActiveTab('notices')}>View All</span>
                  </div>
                  <div className="notice-list">
                    {noticesList.slice(0, 3).map((notice) => (
                      <div className="notice-item" key={notice.id}>
                        <div className="notice-item-title">{notice.title}</div>
                        <div className="notice-item-meta">
                          <span>📢 {notice.posted_by}</span>
                          <span>📅 {notice.created_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 1. Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="panel-card">
              <div className="section-header" style={{ marginBottom: '1.2rem' }}>
                <h3>Subject-wise Attendance Tracker</h3>
                <span className={`badge ${overallAttendance >= 75 ? 'success' : 'danger'}`} style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  Overall Average: {overallAttendance}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {subjectAttendance.map((sub, index) => {
                  const percentage = sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 0;
                  const isSafe = percentage >= 75;
                  const trackColor = isSafe ? 'var(--success)' : 'var(--danger)';
                  const statusMessage = isSafe ? '✓ Safe (Above 75% Criteria)' : '⚠ Shortage (Attend next classes)';

                  return (
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
                        borderTop: `4px solid ${trackColor}`
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            {sub.subjectCode}
                          </span>
                          <span className={`badge ${isSafe ? 'success' : 'danger'}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {percentage}%
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.8rem' }}>
                          {sub.subjectName}
                        </h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                          <span>Attended: <strong>{sub.present}</strong></span>
                          <span>Total Classes: <strong>{sub.total}</strong></span>
                        </div>

                        {/* Progress bar */}
                        <div className="course-progress-track" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', overflow: 'hidden', marginBottom: '0.8rem' }}>
                          <div 
                            className="course-progress-fill" 
                            style={{ 
                              height: '100%', 
                              width: `${percentage}%`, 
                              backgroundColor: trackColor,
                              borderRadius: '4px'
                            }}
                          />
                        </div>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trackColor }}>
                        {statusMessage}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Past Semesters Attendance History */}
              <div style={{ marginTop: '2.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                  🕒 Past Semesters Attendance History
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>1st Semester</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem', display: 'block' }}>82%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>✓ Met Criteria</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>2nd Semester</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem', display: 'block' }}>85%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>✓ Met Criteria</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>3rd Semester</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem', display: 'block' }}>78%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>✓ Met Criteria</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderTop: '3px solid var(--success)', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>4th Semester</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem', display: 'block' }}>88%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600 }}>✓ Met Criteria</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. Timetable Tab */}
          {activeTab === 'timetable' && (
            <div className="panel-card" style={{ padding: '2rem' }}>
              <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                <h3>Weekly Lecture Planner</h3>
                <span className="badge info" style={{ fontSize: '0.85rem' }}>Semester V Schedule</span>
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
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                        <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                        <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                        <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                        <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Data Structures</div>
                        <span className="badge success" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-201</span>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                        ⏰ 10:00 AM - 11:00 AM
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Management</div>
                        <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Management</div>
                        <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Management</div>
                        <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Management</div>
                        <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Database Management</div>
                        <span className="badge warning" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-202</span>
                      </td>
                    </tr>

                    <tr style={{ backgroundColor: 'transparent' }}>
                      <td colSpan="6" style={{ padding: '0.4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                        ☕ 11:00 AM - 12:00 PM | Lunch Break
                      </td>
                    </tr>

                    <tr>
                      <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                        ⏰ 12:00 PM - 01:00 PM
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                        <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                        <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                        <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                        <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Web Development</div>
                        <span className="badge info" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-203</span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem', verticalAlign: 'middle', borderLeft: '4px solid var(--accent)' }}>
                        ⏰ 02:00 PM - 03:00 PM
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                        <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                        <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                        <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                        <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                      </td>
                      <td style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>Operating Systems</div>
                        <span className="badge secondary" style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>Room B-204</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Assignments Tab */}
          {activeTab === 'assignments' && (
            <div>
              <div className="section-header">
                <h3>My Course Assignments</h3>
              </div>
              <div className="inner-grid-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                {assignmentsList.map((assign) => {
                  // Determine status styling
                  const isGraded = assign.submissionStatus === 'Graded';
                  const isPending = assign.submissionStatus === 'Pending';
                  const leftColor = isGraded ? 'var(--success)' : isPending ? 'var(--warning)' : 'var(--danger)';
                  const statusLabel = isGraded ? 'GRADED' : isPending ? 'PENDING EVALUATION' : 'NOT SUBMITTED';

                  return (
                    <div 
                      className="card-item" 
                      key={assign.id}
                      style={{ 
                        borderLeft: `5px solid ${leftColor}`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        boxShadow: 'var(--shadow-sm)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                          <span className="badge warning" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            📚 {assign.subjectName}
                          </span>
                          <span 
                            className={`badge ${isGraded ? 'success' : isPending ? 'warning' : 'danger'}`}
                            style={{ fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <h4 className="card-item-title" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                          {assign.title}
                        </h4>
                        <p className="card-item-desc" style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: '1.4', marginBottom: '1.2rem' }}>
                          {assign.description}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            📅 Due: <strong>{assign.due_date}</strong>
                          </span>
                        </div>

                        {/* Graded Details */}
                        {isGraded && (
                          <div style={{ backgroundColor: 'var(--success-glow)', padding: '0.6rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                            <span>💯 Final Grade</span>
                            <span>{assign.marks} / 100</span>
                          </div>
                        )}

                        {/* Pending Details */}
                        {isPending && (
                          <div style={{ backgroundColor: 'var(--warning-glow)', padding: '0.6rem', borderRadius: '8px', textAlign: 'center', color: 'var(--warning)', fontWeight: 500, fontSize: '0.85rem' }}>
                            📥 Submitted! Waiting for faculty grading.
                          </div>
                        )}

                        {/* Upload Actions */}
                        {!assign.submissionStatus && submittingId !== assign.id && (
                          <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                            onClick={() => setSubmittingId(assign.id)}
                          >
                            📤 Upload Submission
                          </button>
                        )}

                        {submittingId === assign.id && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {/* Dash Box File Input */}
                            <div style={{ 
                              border: '2px dashed var(--border-color)', 
                              borderRadius: '8px', 
                              padding: '1rem', 
                              textAlign: 'center', 
                              backgroundColor: 'var(--bg-primary)', 
                              position: 'relative', 
                              cursor: 'pointer',
                              transition: 'border-color 0.2s'
                            }}>
                              <input 
                                type="file" 
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
                                onChange={handleAssignmentFileChange}
                              />
                              <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '0.2rem' }}>📁</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: uploadFileName ? 'var(--success)' : 'var(--text-muted)' }}>
                                {uploadFileName ? `✓ Selected: ${uploadFileName}` : "Click to select file..."}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                className="btn-primary" 
                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                                onClick={() => handleAssignmentSubmit(assign.id)}
                                disabled={!uploadFileName}
                              >
                                Submit Assignment
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => { setSubmittingId(null); setUploadFileName(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Notices Tab */}
          {activeTab === 'notices' && (
            <div>
              <div className="section-header">
                <h3>Campus Bulletin Board</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
                {noticesList.map((notice) => {
                  // Determine status styling based on category
                  const isUrgent = notice.category === 'Urgent';
                  const isAcademic = notice.category === 'Academic';
                  const isEvents = notice.category === 'Events';
                  
                  const leftColor = isUrgent 
                    ? 'var(--danger)' 
                    : isAcademic 
                      ? '#a855f7' 
                      : isEvents 
                        ? 'var(--warning)' 
                        : 'var(--accent)';
                        
                  const badgeColorClass = isUrgent 
                    ? 'danger' 
                    : isAcademic 
                      ? 'secondary' 
                      : isEvents 
                        ? 'warning' 
                        : 'success';

                  return (
                    <div 
                      key={notice.id} 
                      style={{ 
                        backgroundColor: '#ffffff',
                        borderLeft: `5px solid ${leftColor}`, 
                        borderRadius: '10px',
                        padding: '1.5rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          {notice.title}
                        </h4>
                        <span className={`badge ${badgeColorClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          {notice.category}
                        </span>
                      </div>
                      
                      <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', lineHeight: '1.5', margin: 0 }}>
                        {notice.content}
                      </p>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '1.5rem', 
                        fontSize: '0.8rem', 
                        color: 'var(--text-muted)', 
                        borderTop: '1px solid var(--border-color)', 
                        paddingTop: '0.8rem',
                        marginTop: '0.4rem',
                        flexWrap: 'wrap'
                      }}>
                        <span>👤 Posted by: <strong>{notice.posted_by}</strong></span>
                        <span>📅 Date: <strong>{notice.created_at}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Results Tab */}
          {activeTab === 'results' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', backgroundColor: '#ffffff', borderLeft: '5px solid var(--accent)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cumulative CGPA</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>{cgpa} / 10.0</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✓ Outstanding Performance</span>
                  </div>
                  <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>🏆</div>
                </div>

                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', backgroundColor: '#ffffff', borderLeft: '5px solid var(--success)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Completed Semesters</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>4 Semesters</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>84 Credits Earned</span>
                  </div>
                  <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>🎓</div>
                </div>
              </div>

              {/* Title */}
              <div className="section-header" style={{ marginBottom: '1.2rem' }}>
                <h3>Academic Semester-wise Grades</h3>
              </div>

              {/* Accordion Semesters List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pastResults && pastResults.map((sem, idx) => {
                  const isOpen = expandedSem === sem.semester;

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* Accordion Header */}
                      <div 
                        onClick={() => setExpandedSem(isOpen ? null : sem.semester)}
                        style={{ 
                          padding: '1.2rem 1.5rem', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          backgroundColor: isOpen ? 'var(--bg-primary)' : '#ffffff',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          📁 {sem.semester}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span className="badge success" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            SGPA: {sem.sgpa.toFixed(2)}
                          </span>
                          <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.85rem' }}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Accordion Body */}
                      {isOpen && (
                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                          <div className="data-table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Subject Code</th>
                                  <th>Subject Name</th>
                                  <th>Marks Obtained</th>
                                  <th>Total Marks</th>
                                  <th>Grade Letter</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sem.subjects.map((sub, sIdx) => (
                                  <tr key={sIdx}>
                                    <td><code>{sub.code}</code></td>
                                    <td><strong>{sub.name}</strong></td>
                                    <td>{sub.marks}</td>
                                    <td>{sub.total}</td>
                                    <td><span className="badge success">{sub.grade}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current 5th Sem Segment */}
                <div 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px', 
                    border: '1px dashed var(--accent)', 
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    marginTop: '0.5rem'
                  }}
                >
                  <div 
                    onClick={() => setExpandedSem(expandedSem === '5th' ? null : '5th')}
                    style={{ 
                      padding: '1.2rem 1.5rem', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      backgroundColor: expandedSem === '5th' ? 'var(--accent-glow)' : '#ffffff'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                      ⚡ Current 5th Semester (Ongoing Mid-Term)
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span className="badge warning" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                        In Progress
                      </span>
                      <span style={{ transform: expandedSem === '5th' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.85rem' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {expandedSem === '5th' && (
                    <div style={{ padding: '1.5rem', borderTop: '1px dashed var(--accent)' }}>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Subject Code</th>
                              <th>Subject Name</th>
                              <th>Marks Obtained</th>
                              <th>Total Marks</th>
                              <th>Grade Letter</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gradesList.map((res, idx) => (
                              <tr key={idx}>
                                <td><code>{res.subjectCode}</code></td>
                                <td><strong>{res.subjectName}</strong></td>
                                <td>{res.marks_obtained}</td>
                                <td>{res.total_marks}</td>
                                <td><span className="badge success">{res.grade}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 6. Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', backgroundColor: '#ffffff', borderLeft: `5px solid ${feeStatus.status === 'Paid' ? 'var(--success)' : 'var(--danger)'}` }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Dues</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: feeStatus.status === 'Paid' ? 'var(--success)' : 'var(--danger)', margin: '0.2rem 0' }}>
                      ₹{feeStatus.status === 'Paid' ? '0.00' : '45,000.00'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date: {feeStatus.last_date}</span>
                  </div>
                  <div style={{ fontSize: '2.2rem', display: 'flex', alignItems: 'center' }}>
                    {feeStatus.status === 'Paid' ? '✅' : '🚨'}
                  </div>
                </div>

                <div className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderRadius: '10px', boxShadow: 'var(--shadow-sm)', backgroundColor: '#ffffff', borderLeft: '5px solid var(--success)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Paid to Date</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.2rem 0' }}>
                      ₹{feeStatus.status === 'Paid' ? '2,25,000.00' : '1,80,000.00'}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✓ All past semesters paid</span>
                  </div>
                  <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center' }}>💳</div>
                </div>
              </div>

              {/* Current Semester Card Redesign */}
              <div className="panel-card" style={{ marginBottom: '2rem', padding: '1.8rem' }}>
                <div className="section-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1.2rem' }}>
                  <h3>Current Billing Statement (5th Semester)</h3>
                  <span className={`badge ${feeStatus.status === 'Paid' ? 'success' : 'danger'}`} style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {feeStatus.status === 'Paid' ? 'FULLY PAID' : 'PENDING PAYMENT'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tuition / Academic Fee (5th Sem)</span>
                    <span style={{ fontWeight: 600 }}>₹45,000.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingBottom: '0.8rem', borderBottom: '1px dashed var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Paid Amount</span>
                    <span style={{ fontWeight: 600, color: feeStatus.status === 'Paid' ? 'var(--success)' : 'var(--text-muted)' }}>
                      ₹{feeStatus.status === 'Paid' ? '45,000.00' : '0.00'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.4rem' }}>
                    <span>Net Payable Balance</span>
                    <span style={{ color: feeStatus.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>
                      ₹{feeStatus.status === 'Paid' ? '0.00' : '45,000.00'}
                    </span>
                  </div>

                  {feeStatus.status !== 'Paid' ? (
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.8rem', width: '100%', marginTop: '1.2rem', fontSize: '0.95rem', fontWeight: 600 }} 
                      onClick={() => setShowFeeModal(true)}
                    >
                      💳 Pay Tuition Fee Online (Simulation Gateway)
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                      <div style={{ flex: 1, textAlign: 'center', padding: '0.65rem', borderRadius: '8px', backgroundColor: 'var(--success-glow)', color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>
                        ✓ Payment Completed Successfully!
                      </div>
                      <button 
                        className="btn-secondary" 
                        style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        onClick={() => alert("Mock PDF Receipt downloaded successfully!\nReceipt No: ERP-REC-59281\nAmount: ₹45,000.00")}
                      >
                        📄 Download Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Past Transactions History List */}
              <div className="panel-card" style={{ padding: '1.8rem' }}>
                <div className="section-header" style={{ marginBottom: '1.2rem' }}>
                  <h3>Past Transaction History</h3>
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Fund Details / Description</th>
                        <th>Date Paid</th>
                        <th>Amount</th>
                        <th>Payment Mode</th>
                        <th>Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>ERP-REC-48291</code></td>
                        <td><strong>Tuition Fee - 4th Semester</strong></td>
                        <td>10 Jan 2026</td>
                        <td>₹45,000.00</td>
                        <td><span className="badge success">ONLINE UPI</span></td>
                        <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => alert("Receipt No: ERP-REC-48291\nTuition Fee 4th Semester\nPaid: ₹45,000.00")}>View 📄</button></td>
                      </tr>
                      <tr>
                        <td><code>ERP-REC-39281</code></td>
                        <td><strong>Library Membership Card</strong></td>
                        <td>12 Jan 2026</td>
                        <td>₹2,500.00</td>
                        <td><span className="badge success">NET BANKING</span></td>
                        <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => alert("Receipt No: ERP-REC-39281\nLibrary Membership Fee\nPaid: ₹2,500.00")}>View 📄</button></td>
                      </tr>
                      <tr>
                        <td><code>ERP-REC-28192</code></td>
                        <td><strong>Hostel Caution Deposit</strong></td>
                        <td>15 Jul 2025</td>
                        <td>₹10,000.00</td>
                        <td><span className="badge success">DEBIT CARD</span></td>
                        <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => alert("Receipt No: ERP-REC-28192\nHostel Security Deposit\nPaid: ₹10,000.00")}>View 📄</button></td>
                      </tr>
                      <tr>
                        <td><code>ERP-REC-19283</code></td>
                        <td><strong>Exam Registration Fee - Sem 4</strong></td>
                        <td>12 Nov 2025</td>
                        <td>₹3,000.00</td>
                        <td><span className="badge success">ONLINE UPI</span></td>
                        <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => alert("Receipt No: ERP-REC-19283\nExam Registration Fee Sem 4\nPaid: ₹3,000.00")}>View 📄</button></td>
                      </tr>
                      <tr>
                        <td><code>ERP-REC-09283</code></td>
                        <td><strong>Laboratory Development Fund</strong></td>
                        <td>20 Jul 2025</td>
                        <td>₹5,000.00</td>
                        <td><span className="badge success">NET BANKING</span></td>
                        <td><button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }} onClick={() => alert("Receipt No: ERP-REC-09283\nLaboratory Development Fee\nPaid: ₹5,000.00")}>View 📄</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. Profile Tab */}
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
                  Student Portal
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

                  {/* Course Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🎓 Course / Branch
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>B.Tech - Computer Science Engineering</span>
                  </div>

                  {/* Semester Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📅 Semester
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>5th Semester (3rd Year)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Online Fee Payment Modal Simulator */}
      {showFeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Pay Semester Fees</h3>
              <button className="modal-close-btn" onClick={() => setShowFeeModal(false)}>❌</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Transaction Amount</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>₹45,000.00</div>
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input type="text" className="form-input" defaultValue={user.name} style={{ padding: '0.7rem' }} />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <input type="text" className="form-input" placeholder="4111 2222 3333 4444" style={{ padding: '0.7rem' }} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Expiry Date</label>
                  <input type="text" className="form-input" placeholder="MM/YY" style={{ padding: '0.7rem' }} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>CVV</label>
                  <input type="password" className="form-input" placeholder="***" style={{ padding: '0.7rem' }} />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
                🔒 Secure Sandbox Simulator - No real money is processed.
              </div>

              <div className="modal-buttons">
                <button className="btn-secondary" onClick={() => setShowFeeModal(false)} disabled={payingFee}>Cancel</button>
                <button className="btn-primary" onClick={handlePayFee} disabled={payingFee}>
                  {payingFee ? 'Processing...' : 'Pay Virtual Amount'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default StudentDashboard;
