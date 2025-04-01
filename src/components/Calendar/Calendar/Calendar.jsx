import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';


const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return <button onClick={handleLogout} className="logout-button">Log out</button>;
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

function TaskBubble({ name }) {
  return (
    <div className="task-bubble-wrapper">
      <div className="task-bubble">{name}</div>
      <span className="tooltip">{name}</span>
    </div>
  );
}

const Calendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentYear, setYear] = useState(today.getFullYear());
  const [currentMonth, setMonth] = useState(today.getMonth());

  const tasks = {
    '2025-03-03': ['task1 ghfkhgdkfhg jkghdfgh dhsfkbgvfdbgv djghdfbvksbfgvbz dfjkfgzud', 'task2', 'task3'],
    '2025-03-10': ['task1', 'task2', 'task3'],
    '2025-03-21': ['task1', 'task2'],
    '2025-03-27': ['task1', 'task2', 'task3']
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handleTaskClick = () => {
    navigate('/completed');
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setMonth(12);
      setYear(currentYear - 1);
    } else {
      setMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setMonth(0);
      setYear(currentYear + 1);
    } else {
      setMonth(currentMonth + 1);
    }
  };

  const handleYearClick = () => {
    const newYear = prompt('Enter year:', currentYear);
    if (newYear) setYear(parseInt(newYear));
  };

  const handleMonthClick = () => {
    const newMonth = prompt('Enter month (1-12):', currentMonth);
    if (newMonth >= 0 && newMonth <= 12) setMonth(parseInt(newMonth));
  };

  const getTasksForDay = (day) => {
    const paddedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    const key = `${currentYear}-${paddedMonth}-${paddedDay}`;
    return tasks[key] || [];
  };

  return (
    <div className="calendar-page">
      <div className="top-header">
        <UserProfile />
        <LogoutButton />
      </div>

      <div className="completed-tasks-title">Completed tasks</div>

      <div className="calendar-box">
        <div className="calendar-header">
          <button onClick={prevMonth}>◀</button>
          <span onClick={handleMonthClick}>
            {new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long' })}
          </span>
          <span onClick={handleYearClick}>{currentYear}</span>
          <button onClick={nextMonth}>▶</button>
        </div>

        <div className="weekdays">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={i} className="weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {[...Array(daysInMonth)].map((_, index) => {
            const day = index + 1;
            const taskList = getTasksForDay(day);
            return (
              <div key={day} className="calendar-cell" onClick={handleTaskClick}>
                <div>{day}</div>
                {taskList.map((task, i) => (
                  <TaskBubble key={i} name={task} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="back-section">
        <button className="back-button" onClick={() => navigate(-1)}>←</button>
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default Calendar;
