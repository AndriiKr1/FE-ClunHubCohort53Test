import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';

const LogoutButton = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
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
      <img 
        src={userData.avatarId ? `/assets/avatars/${userData.avatarId}.png` : '/avatar.png'} 
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

const CompletedTasks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector(state => state.tasks);
  
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateClick = () => {
    const pickedDate = prompt('Enter date (YYYY-MM-DD):');
    if (pickedDate) setSelectedDate(pickedDate);
  };

  useEffect(() => {
    // Получаем выбранную дату из localStorage или используем сегодняшнюю дату
    const storedDate = localStorage.getItem('selectedDate');
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const dateToUse = storedDate || formattedToday;
    setSelectedDate(dateToUse);
    
    fetchTasksForDate(dateToUse);
  }, [dispatch]);

  const fetchTasksForDate = async (date) => {
    // Разбираем дату для создания начальной и конечной даты дня
    const [year, month, day] = date.split('-').map(num => parseInt(num));
    const startDate = new Date(year, month - 1, day);
    const endDate = new Date(year, month - 1, day, 23, 59, 59);
    
    // Загружаем задачи из API
    await dispatch(fetchTasks({
      fromDate: startDate.toISOString(),
      toDate: endDate.toISOString()
    }));
  };

  const handleDateClick = () => {
    const pickedDate = prompt('Enter date (YYYY-MM-DD):', selectedDate);
    if (pickedDate && /^\d{4}-\d{2}-\d{2}$/.test(pickedDate)) {
      setSelectedDate(pickedDate);
      fetchTasksForDate(pickedDate);
    }
  };

  const formatDate = (dateString) => {
    try {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    const newStatus = completed ? 'IN_PROGRESS' : 'COMPLETED';
    dispatch(updateTaskStatus({ id: taskId, status: newStatus }));
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

      <button className="date-title" onClick={handleDateClick}>
        {formatDate(selectedDate)}
      </button>

      {error && <div className="error-message">{error}</div>}

      <div className="task-list">
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div 
              className={`task-card ${task.completed ? 'completed' : 'pending'}`} 
              key={task.id}
              onClick={() => toggleTaskCompletion(task.id, task.completed)}
            >
              <span className="task-status-indicator"></span>
              {task.title}
              {task.description && (
                <div className="task-description">{task.description}</div>
              )}
            </div>
          ))
        ) : (
          <div className="no-tasks">No tasks for this date</div>
        )}
      </div>

      <div className="back-section">
        <button className="back-button" onClick={handleBackClick}>←</button>
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default CompletedTasks;