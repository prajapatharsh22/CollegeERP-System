import React, { useState } from 'react';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

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
