import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add User Form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Student');
  const [registering, setRegistering] = useState(false);

  // Manage lists states
  const [usersList, setUsersList] = useState([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
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

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL + '/api/admin/dashboard');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError('Failed to fetch admin metrics.');
      }
    } catch (err) {
      setError('Connection to backend failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!regUsername || !regPassword || !regEmail || !regName) {
      alert('Please fill in all details.');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch(API_URL + '/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          email: regEmail,
          name: regName,
          role: regRole
        })
      });

      const resData = await response.json();

      if (response.ok) {
        alert(`${regRole} registered successfully!`);
        // Reset form
        setRegUsername('');
        setRegPassword('');
        setRegEmail('');
        setRegName('');
        fetchAdminData(); // Refresh counts
        if (activeTab === 'users') {
          fetchRegisteredUsers();
        }
      } else {
        alert(resData.error || 'Failed to register user.');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering user.');
    } finally {
      setRegistering(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    const confirmMsg = `Are you sure you want to ${action.toLowerCase()} this registration request?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch(API_URL + '/api/requests/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      if (response.ok) {
        alert(`Request successfully ${action}d!`);
        fetchAdminData(); // Reload statistics and requestsList
        if (activeTab === 'users') {
          fetchRegisteredUsers();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${action.toLowerCase()} request.`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating request.');
    }
  };

  const fetchRegisteredUsers = async () => {
    setFetchingUsers(true);
    try {
      const response = await fetch(API_URL + '/api/faculty/dashboard/2'); // Fallback seed fetch
      if (response.ok) {
        const result = await response.json();
        setUsersList(result.studentsList || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchRegisteredUsers();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <h2>Loading Admin Portal...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)' }}>{error}</h2>
        <button onClick={fetchAdminData} className="btn-primary" style={{ marginTop: '1rem' }}>Retry Connection</button>
      </div>
    );
  }

  const {
    totalStudents,
    totalFaculty,
    totalCourses,
    totalRevenue,
    targetRevenue,
    attendanceTrends,
    topCourses,
    recentActivities,
    requestsList
  } = data;

  const pendingRequestsCount = requestsList ? requestsList.length : 0;

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
          <li className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">👥</span> Manage Users
          </li>
          <li className={`sidebar-item ${activeTab === 'register' ? 'active' : ''}`} onClick={() => { setActiveTab('register'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">➕</span> Register Account
          </li>
          <li className={`sidebar-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">🔔</span> Requests
            {pendingRequestsCount > 0 && (
              <span style={{ 
                marginLeft: 'auto', 
                backgroundColor: '#ef4444', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '10px', 
                fontSize: '0.75rem', 
                fontWeight: 'bold' 
              }}>
                {pendingRequestsCount}
              </span>
            )}
          </li>
          <li className={`sidebar-item ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => { setActiveTab('notices'); setIsSidebarOpen(false); }}>
            <span className="sidebar-icon">📢</span> Notices Manager
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

              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              title="Dashboard"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <img className="avatar" src={user.avatar_url} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
            </div>
          </div>
        </header>

        {/* Dashboard Pages */}
        <main className="page-content">
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome */}
              <div className="welcome-section">
                <h2>Welcome back, Admin! 👑</h2>
                <p>Overviewing global campus database logs and fee reports.</p>
              </div>

              {/* Stats Grid */}
              <div className="cards-grid">
                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Students</span>
                    <span className="stat-card-value">{totalStudents}</span>
                    <span className="stat-card-subtext">Total Active Students</span>
                  </div>
                  <div className="stat-card-icon-container blue">👥</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Faculty</span>
                    <span className="stat-card-value">{totalFaculty}</span>
                    <span className="stat-card-subtext">Total Instructors</span>
                  </div>
                  <div className="stat-card-icon-container green">👨‍🏫</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Courses</span>
                    <span className="stat-card-value">{totalCourses}</span>
                    <span className="stat-card-subtext">Registered Programs</span>
                  </div>
                  <div className="stat-card-icon-container blue">🏫</div>
                </div>

                <div className="stat-card">
                  <div className="stat-card-info">
                    <span className="stat-card-label">Revenue Collected</span>
                    <span className="stat-card-value">₹{(totalRevenue / 100000).toFixed(1)}L</span>
                    <span className="stat-card-subtext">Target: ₹{(targetRevenue / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="stat-card-icon-container orange">💳</div>
                </div>
              </div>

              {/* Grid: Charts */}
              <div className="dashboard-grid">
                {/* SVG Attendance Overview */}
                <div className="panel-card">
                  <h3>Attendance Overview</h3>
                  <div className="chart-container" style={{ marginTop: '1.5rem' }}>
                    <svg className="chart-svg" viewBox="0 0 500 220">
                      <defs>
                        <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="470" y2="30" stroke="var(--border-color)" strokeDasharray="4 4" />
                      <line x1="40" y1="90" x2="470" y2="90" stroke="var(--border-color)" strokeDasharray="4 4" />
                      <line x1="40" y1="150" x2="470" y2="150" stroke="var(--border-color)" strokeDasharray="4 4" />
                      <line x1="40" y1="170" x2="470" y2="170" stroke="var(--border-color)" />

                      {/* Y-Labels */}
                      <text x="15" y="35" fill="var(--text-light)" fontSize="10">100%</text>
                      <text x="15" y="95" fill="var(--text-light)" fontSize="10">50%</text>
                      <text x="15" y="155" fill="var(--text-light)" fontSize="10">0%</text>

                      {/* Area Fill */}
                      <path
                        d="M 40 170 L 40 102 L 126 97 L 212 92 L 298 94 L 384 88 L 470 90 L 470 170 Z"
                        fill="url(#gradient-area)"
                      />
                      <path
                        d="M 40 102 L 126 97 L 212 92 L 298 94 L 384 88 L 470 90"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="3"
                      />

                      {/* X-Labels */}
                      <text x="30" y="195" fill="var(--text-light)" fontSize="10">Jan</text>
                      <text x="116" y="195" fill="var(--text-light)" fontSize="10">Feb</text>
                      <text x="202" y="195" fill="var(--text-light)" fontSize="10">Mar</text>
                      <text x="288" y="195" fill="var(--text-light)" fontSize="10">Apr</text>
                      <text x="374" y="195" fill="var(--text-light)" fontSize="10">May</text>
                      <text x="460" y="195" fill="var(--text-light)" fontSize="10">Jun</text>
                    </svg>
                  </div>
                </div>

                {/* SVG Donut Chart */}
                <div className="panel-card">
                  <h3>Fee Collection</h3>
                  <div className="donut-chart-wrapper">
                    <div className="chart-container" style={{ width: '150px', height: '150px' }}>
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                        <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="#fff" />
                        <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--warning-glow)" strokeWidth="4" />
                        <circle className="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent)" strokeWidth="4" 
                          strokeDasharray="75 25" strokeDashoffset="25" />
                      </svg>
                      <div className="donut-percentage">75%</div>
                    </div>

                    <div className="donut-legend">
                      <div className="legend-item">
                        <span className="legend-dot collected"></span> Collected (75%)
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot pending"></span> Pending (25%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid: Activities & Top courses */}
              <div className="dashboard-grid">
                {/* Recent Activities */}
                <div className="panel-card">
                  <h3>Recent System Activities</h3>
                  <div className="activity-list" style={{ marginTop: '1.2rem' }}>
                    {recentActivities.map((act) => (
                      <div className="activity-item" key={act.id}>
                        <div className="activity-info">
                          <span className={`activity-icon-indicator ${act.type}`}></span>
                          <span className="activity-desc">{act.message}</span>
                        </div>
                        <span className="activity-time">{act.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Courses */}
                <div className="panel-card">
                  <h3>Top Enrolled branches</h3>
                  <div className="top-courses-list" style={{ marginTop: '1.2rem' }}>
                    {topCourses.map((c, idx) => (
                      <div className="course-progress-item" key={idx}>
                        <div className="course-progress-labels">
                          <span>{c.name}</span>
                          <span>{c.students} Students</span>
                        </div>
                        <div className="course-progress-track">
                          <div 
                            className="course-progress-fill" 
                            style={{ width: `${(c.students / 945) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 1. Register User Account Tab */}
          {activeTab === 'register' && (
            <div className="panel-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div className="section-header">
                <h3>Register New ERP Account</h3>
              </div>

              <form onSubmit={handleRegisterUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Amit Kumar"
                    style={{ padding: '0.7rem' }}
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. amit@erp.com"
                    style={{ padding: '0.7rem' }}
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Username</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. amit"
                      style={{ padding: '0.7rem' }}
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                    <label>Password</label>
                    <input 
                      type="password" 
                      className="form-input" 
                      placeholder="Password"
                      style={{ padding: '0.7rem' }}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>System Access Role</label>
                  <select 
                    className="form-input" 
                    style={{ appearance: 'none', padding: '0.7rem' }}
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                  >
                    <option value="Student">Student Portal Access</option>
                    <option value="Faculty">Faculty Portal Access</option>
                    <option value="Admin">Admin Super Administrator</option>
                  </select>
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }} disabled={registering}>
                  {registering ? 'Creating user entry...' : 'Register User Profile'}
                </button>
              </form>
            </div>
          )}

          {/* 2. Manage Users Tab */}
          {activeTab === 'users' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Registered Student Accounts</h3>
                <button className="btn-primary" onClick={() => setActiveTab('register')}>Add New User</button>
              </div>

              {fetchingUsers ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Fetching users...</div>
              ) : (
                <div className="data-table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Access ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email Address</th>
                        <th>Role Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ST-1</td>
                        <td><strong>Harsh Verma</strong></td>
                        <td>harsh</td>
                        <td>harsh@erp.com</td>
                        <td><span className="badge success">Student</span></td>
                      </tr>
                      {usersList.filter(u => u.username !== 'harsh').map((usr, idx) => (
                        <tr key={idx}>
                          <td>ST-{usr.id || idx + 2}</td>
                          <td><strong>{usr.name}</strong></td>
                          <td>{usr.username}</td>
                          <td>{usr.email}</td>
                          <td><span className="badge success">Student</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. Registration Requests Approval Tab */}
          {activeTab === 'requests' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Access Registration Requests</h3>
              </div>

              {pendingRequestsCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
                  <h3>No Pending Access Requests</h3>
                  <p style={{ marginTop: '0.5rem' }}>All registration applications have been evaluated.</p>
                </div>
              ) : (
                <div className="data-table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date Submitted</th>
                        <th>Full Name</th>
                        <th>Username</th>
                        <th>Email ID</th>
                        <th>Requested Access</th>
                        <th style={{ textAlign: 'center' }}>Action Buttons</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requestsList.map((req) => (
                        <tr key={req.id}>
                          <td>{req.created_at}</td>
                          <td><strong>{req.name}</strong></td>
                          <td><code>{req.username}</code></td>
                          <td>{req.email}</td>
                          <td>
                            <span className={`badge ${req.role === 'Student' ? 'success' : 'warning'}`}>
                              {req.role}
                            </span>
                          </td>
                          <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button 
                              className="badge success" 
                              style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                              onClick={() => handleRequestAction(req.id, 'Approve')}
                            >
                              Approve
                            </button>
                            <button 
                              className="badge danger" 
                              style={{ border: 'none', cursor: 'pointer', padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                              onClick={() => handleRequestAction(req.id, 'Reject')}
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'notices' && (
            <div className="panel-card">
              <div className="section-header">
                <h3>Notices Board Manager</h3>
              </div>
              <AdminNoticesManager noticesList={data.noticesList || []} fetchAdminData={fetchAdminData} />
            </div>
          )}
        </main>
      </div>
      {isSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
      )}
    </div>
  );
};

const AdminNoticesManager = ({ noticesList, fetchAdminData }) => {
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
      const response = await fetch(API_URL + '/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, postedBy: 'Admin' })
      });

      if (response.ok) {
        setSuccess('Notice published successfully!');
        setTitle('');
        setContent('');
        setCategory('General');
        fetchAdminData();
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
      const response = await fetch(`${API_URL}/api/notices/${noticeId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAdminData();
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
              placeholder="e.g. End Semester Exam Schedule" 
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

export default AdminDashboard;

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'
  : 'https://collegeerp-system.onrender.com';
