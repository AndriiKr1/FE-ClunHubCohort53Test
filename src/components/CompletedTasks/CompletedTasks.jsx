import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, updateTaskStatus } from '../../store/slices/taskSlice';
import { formatDateForApi } from '../../utils/dataMappers';
import ProfileHeader from '../ProfileHeader/ProfileHeader';
import leftArrow from '../../assets/images/left.png';
import './CompletedTasks.css';

const CompletedTasks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector(state => state.tasks);
  const [selectedDate, setSelectedDate] = useState('');

  const fetchTasksForDate = useCallback(async (date) => {
    try {
      await dispatch(fetchTasks({
        fromDate: date,
        toDate: date,
        includeCompleted: true
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    const storedDate = localStorage.getItem('selectedDate');
    const today = new Date();
    const formattedToday = formatDateForApi(today);
    
    const dateToUse = storedDate || formattedToday;
    setSelectedDate(dateToUse);
    fetchTasksForDate(dateToUse);
  }, [fetchTasksForDate]);

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
    } catch {
      return dateString;
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      const newStatus = completed ? 'IN_PROGRESS' : 'COMPLETED';
      
      await dispatch(updateTaskStatus({ 
        id: taskId, 
        status: newStatus 
      })).unwrap();
      
      // Refresh tasks after status update
      await fetchTasksForDate(selectedDate);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Filter only completed tasks
  const completedTasks = tasks.filter(task => task.completed || task.status === 'COMPLETED');

  return (
    <div className="completed-page">
      <div className="top-header">
        <ProfileHeader />
      </div>

      <div className="date-label-display">
        {formatDate(selectedDate)}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="task-list">
        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : completedTasks.length > 0 ? (
          completedTasks.map((task) => (
            <div 
              className="task-card completed" 
              key={task.id}
              onClick={() => toggleTaskCompletion(task.id, true)}
            >
              <span className="task-status-indicator"></span>
              {task.title || task.name || 'Untitled Task'}
              {task.description && (
                <div className="task-description">{task.description}</div>
              )}
            </div>
          ))
        ) : (
          <div className="no-tasks">No completed tasks for this date</div>
        )}
      </div>

      <div className="back-section">
        <img
          src={leftArrow}
          alt="back"
          className="back-arrow-img"
          onClick={() => navigate('/calendar')}
        />
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default CompletedTasks;