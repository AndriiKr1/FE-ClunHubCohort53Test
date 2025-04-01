import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompletedTasks.css';

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return <button className="logout-button" onClick={handleLogout}>Log out</button>;
};

const UserProfile = () => {
  const [userData, setUserData] = useState({ username: '', age: '', avatar: '' });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('userData'));
    if (data) setUserData(data);
  }, []);

  return (
    <div className="user-profile">
      <img src={userData.avatar || '/avatar.png'} alt="" className="avatar" />
      <div className="user-info">
        <div className="username-field">{userData.username || 'Username'}</div>
        <div className="age-field">{userData.age || 'Age'}</div>
      </div>
    </div>
  );
};

const CompletedTasks = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('Actual Date');
  const tasks = ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5'];

  const handleDateClick = () => {
    const pickedDate = prompt('Enter date (YYYY-MM-DD):');
    if (pickedDate) setSelectedDate(pickedDate);
  };

  const handleBackClick = () => {
    navigate('/calendar');
  };

  return (
    <div className="completed-page">
      <div className="top-header">
        <LogoutButton />
        <UserProfile />
      </div>

      <button className="date-title" onClick={handleDateClick}>{selectedDate}</button>

      <div className="task-list">
        {tasks.map((task, i) => (
          <div className="task-card" key={i}>{task}</div>
        ))}
      </div>

      <div className="back-section">
        <button className="back-button" onClick={handleBackClick}>←</button>
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default CompletedTasks;