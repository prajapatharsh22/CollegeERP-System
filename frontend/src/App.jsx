import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:5000'
  : 'https://collegeerp-system.onrender.com';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Background Keep-Alive Ping to keep backend warm
  useEffect(() => {
    const pingBackend = () => {
      fetch(`${API_URL}/api/health`).catch(() => {});
    };
    pingBackend(); // Ping immediately on load
    const interval = setInterval(pingBackend, 4 * 60 * 1000); // Repeat every 4 minutes
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('erp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  return (
    <div className="app-container">
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          {user.role === 'Student' && (
            <StudentDashboard user={user} onLogout={handleLogout} />
          )}
          {user.role === 'Faculty' && (
            <FacultyDashboard user={user} onLogout={handleLogout} />
          )}
          {user.role === 'Admin' && (
            <AdminDashboard user={user} onLogout={handleLogout} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
