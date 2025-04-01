import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../store/slices/taskSlice';

import avatar1 from '../../assets/avatars/avatar1.png';
import avatar2 from '../../assets/avatars/avatar2.png';
import avatar3 from '../../assets/avatars/avatar3.png';
import avatar4 from '../../assets/avatars/avatar4.png';
import avatar5 from '../../assets/avatars/avatar5.png';
import avatar6 from '../../assets/avatars/avatar6.png';

const avatarOptions = [
  { id: 'avatar1', image: avatar1 },
  { id: 'avatar2', image: avatar2 },
  { id: 'avatar3', image: avatar3 },
  { id: 'avatar4', image: avatar4 },
  { id: 'avatar5', image: avatar5 },
  { id: 'avatar6', image: avatar6 },
];

const LogoutButton = () => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return <button onClick={handleLogout} className="logout-button">Log out</button>;
};

const UserProfile = () => {
  const [userData, setUserData] = useState({ username: '', age: '', avatarId: '' });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('userData'));
    if (data) setUserData(data);
  }, []);

  const avatarSrc = userData.avatarId && avatarOptions[userData.avatarId] 
    ? avatarOptions[userData.avatarId] 
    : avatar1;

  return (
    <div className="user-profile">
      <img 
        src={avatarSrc} 
        alt="" 
        className="avatar" 
      />
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
  const dispatch = useDispatch();
  const { tasksByDate, loading, error } = useSelector(state => state.tasks);
  
  const today = new Date();
  const [currentYear, setYear] = useState(today.getFullYear());
  const [currentMonth, setMonth] = useState(today.getMonth());

  // Завантажуємо задачі при зміні місяця/року
  useEffect(() => {
    const fetchMonthTasks = async () => {
      try {
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        
        await dispatch(fetchTasks({
          fromDate: startDate.toISOString(),
          toDate: endDate.toISOString()
        })).unwrap();
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      }
    };
    
    fetchMonthTasks();
  }, [currentYear, currentMonth, dispatch]);

  const handleTaskClick = (day) => {
    const paddedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    const dateStr = `${currentYear}-${paddedMonth}-${paddedDay}`;
    
    localStorage.setItem('selectedDate', dateStr);
    navigate('/completed');
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setMonth(11);
      setYear(currentYear - 1);
    } else {
      setMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setMonth(0);
      setYear(currentYear + 1);
    } else {
      setMonth(currentMonth + 1);
    }
  };

  const handleYearClick = () => {
    const newYear = prompt('Enter year:', currentYear);
    if (newYear && !isNaN(parseInt(newYear))) {
      setYear(parseInt(newYear));
    }
  };

  const handleMonthClick = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthOptions = months.map((month, index) => `${index + 1} - ${month}`).join('\n');
    const input = prompt(`Enter month number (1-12):\n${monthOptions}`, currentMonth + 1);
    
    if (input && !isNaN(parseInt(input))) {
      const monthNumber = parseInt(input) - 1;
      if (monthNumber >= 0 && monthNumber <= 11) {
        setMonth(monthNumber);
      }
    }
  };

  const getTasksForDay = (day) => {
    const paddedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const paddedDay = day.toString().padStart(2, '0');
    const key = `${currentYear}-${paddedMonth}-${paddedDay}`;
    return tasksByDate[key] || [];
  };

  const getFirstDayOfMonth = () => {
    return new Date(currentYear, currentMonth, 1).getDay();
  };

  const getStartingDayOfWeek = () => {
    const firstDay = getFirstDayOfMonth();
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startingDay = getStartingDayOfWeek();

  const isToday = (day) => {
    const currentDate = new Date();
    return (
      day === currentDate.getDate() &&
      currentMonth === currentDate.getMonth() &&
      currentYear === currentDate.getFullYear()
    );
  };

  return (
    <div className="calendar-page">
      <div className="top-header">
        <UserProfile />
        <LogoutButton />
      </div>

      <div className="completed-tasks-title">Tasks Calendar</div>

      {error && <div className="error-message">{error}</div>}
      
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

        {loading ? (
          <div className="calendar-loading">Loading calendar...</div>
        ) : (
          <div className="calendar-grid">
            {[...Array(startingDay)].map((_, index) => (
              <div key={`empty-${index}`} className="calendar-cell empty"></div>
            ))}
            
            {[...Array(daysInMonth)].map((_, index) => {
              const day = index + 1;
              const taskList = getTasksForDay(day);
              return (
                <div 
                  key={day} 
                  className={`calendar-cell ${isToday(day) ? 'today' : ''}`} 
                  onClick={() => handleTaskClick(day)}
                >
                  <div className="day-number">{day}</div>
                  {taskList.length > 0 && (
                    <div className="task-count">{taskList.length} task{taskList.length !== 1 ? 's' : ''}</div>
                  )}
                  {taskList.slice(0, 2).map((task, i) => (
                    <TaskBubble key={i} name={task.title} />
                  ))}
                  {taskList.length > 2 && (
                    <div className="more-tasks">+{taskList.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button 
        className="add-task-button"
        onClick={() => navigate('/tasks/new')}
      >
        +
      </button>

      <div className="back-section">
        <button className="back-button" onClick={() => navigate('/dashboard')}>←</button>
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default Calendar;