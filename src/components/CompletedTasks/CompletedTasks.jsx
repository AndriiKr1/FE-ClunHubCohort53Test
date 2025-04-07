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
  const [displayTasks, setDisplayTasks] = useState([]);

  const fetchTasksForDate = useCallback(async (date) => {
    try {
     
      const selectedDateObj = new Date(date);
      const firstDayOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1);
      const lastDayOfMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0);
      
      const fromDate = formatDateForApi(firstDayOfMonth);
      const toDate = formatDateForApi(lastDayOfMonth);
      
      await dispatch(fetchTasks({
        fromDate: fromDate,
        toDate: toDate,
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

  
  useEffect(() => {
    if (!tasks.length) return;
    
    
    const todayDate = formatDateForApi(new Date());
    
   
    const filteredTasks = tasks.filter(task => {
      const isCompleted = task.status === 'COMPLETED' || task.completed;
      
      if (selectedDate === todayDate && isCompleted) {
        
        return true;
      } else if (!isCompleted && task.deadline?.split('T')[0] === selectedDate) {
       
        return true;
      }
      
      return false;
    });
    
    setDisplayTasks(filteredTasks);
  }, [tasks, selectedDate]);

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
      
      
      await fetchTasksForDate(selectedDate);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const completedTasks = displayTasks.filter(task => task.completed || task.status === 'COMPLETED');
  const activeTasks = displayTasks.filter(task => !task.completed && task.status !== 'COMPLETED');

  return (
    <div className="completed-page">
      <div className="top-header">
        <ProfileHeader />
      </div>
  
      <div className="date-title">
        {formatDate(selectedDate)}
      </div>
  
      {error && <div className="error-message">{error}</div>}
  
      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : displayTasks.length === 0 ? (
        <div className="no-tasks">No tasks for this date</div>
      ) : (
        <>
          {/* Show completed tasks */}
          {completedTasks.length > 0 && (
            <>
              <h4 className="subsection-title">Completed Tasks</h4>
              <div className="task-list">
                {completedTasks.map((task) => (
                  <div 
                    className="task-card completed" 
                    key={task.id}
                    onClick={() => toggleTaskCompletion(task.id, true)}
                  >
                    <span className="task-status-indicator">✓ </span>
                    {task.title || task.name || 'Untitled Task'}
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
  
          {/* Show active tasks */}
          {activeTasks.length > 0 && (
            <>
              <h4 className="subsection-title">Active Tasks</h4>
              <div className="task-list">
                {activeTasks.map((task) => (
                  <div 
                    className="task-card" 
                    key={task.id}
                    onClick={() => toggleTaskCompletion(task.id, false)}
                  >
                    <span className="task-status-indicator"></span>
                    {task.title || task.name || 'Untitled Task'}
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
  
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