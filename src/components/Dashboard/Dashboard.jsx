import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Dashboard.module.css';
import ProfileHeader from '../ProfileHeader/ProfileHeader';

import eyesIcon from '/src/assets/images/eyes.png';
import checkmarkIcon from '/src/assets/images/checkmark.png';
import cancelIcon from '/src/assets/images/cancel.png';
import arrowUpIcon from '/src/assets/images/arrow01.svg';  
import arrowDownIcon from '/src/assets/images/arrow02.svg';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTask, setSelectedTask] = useState(null);
  const [confirmationTask, setConfirmationTask] = useState(null);
  const [deleteConfirmationTask, setDeleteConfirmationTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(storedTasks);
    setCurrentPage(0);
  }, [location.state?.shouldRefresh]);

  const handleCompleteTask = (taskId) => {
    const taskToComplete = tasks.find(task => task.id === taskId);
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    
    const completedTaskWithDate = {
      ...taskToComplete,
      completed: true,
      completionDate: new Date().toISOString().split('T')[0]
    };
    
    const existingCalendarTasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
    localStorage.setItem('calendarTasks', JSON.stringify([...existingCalendarTasks, completedTaskWithDate]));
    
    setTasks(updatedTasks);
    setConfirmationTask(null);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    setDeleteConfirmationTask(null);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const handleEditTask = (task) => {
    navigate('/addtask', { 
      state: { 
        taskToEdit: task,
        isEditing: true
      } 
    });
  };

  const TASKS_PER_PAGE = 3;
  const totalPages = Math.ceil(tasks.length / TASKS_PER_PAGE);
  const startIndex = currentPage * TASKS_PER_PAGE;
  
  const visibleTasks = [...tasks]
    .reverse()
    .slice(startIndex, startIndex + TASKS_PER_PAGE);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <ProfileHeader />

      <button 
        className={styles.addTaskButton} 
        onClick={() => navigate('/addtask')}
      >
        Add new task
      </button>

      {tasks.length > TASKS_PER_PAGE && (
        <button
          className={`${styles.arrowButton} ${styles.arrowButtonTop}`}
          onClick={goToPrevPage}
          disabled={currentPage === 0}
        >
          <img 
            src={arrowUpIcon} 
            alt="Show previous tasks" 
            className={styles.arrowIcon} 
          />
        </button>
      )}

      <div className={styles.taskList}>
        {visibleTasks.map(task => (
          <div key={task.id} className={styles.taskRow}>
            <div 
              className={`${styles.taskButton} ${styles.taskText}`}
              onClick={() => handleEditTask(task)}
            >
              {task.name}
            </div>
            <div className={styles.taskIcons}>
              <img 
                src={eyesIcon} 
                alt="view" 
                className={styles.icon} 
                onClick={() => setSelectedTask(task)} 
              />
              <img 
                src={checkmarkIcon} 
                alt="complete" 
                className={styles.icon} 
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmationTask(task);
                }} 
              />
              <img 
                src={cancelIcon} 
                alt="delete" 
                className={styles.icon} 
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmationTask(task);
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      {tasks.length > TASKS_PER_PAGE && (
        <button
          className={`${styles.arrowButton} ${styles.arrowButtonBottom}`}
          onClick={goToNextPage}
          disabled={currentPage >= totalPages - 1}
        >
          <img 
            src={arrowDownIcon} 
            alt="Show next tasks" 
            className={styles.arrowIcon} 
          />
        </button>
      )}

      <button 
        className={styles.completedButton} 
        onClick={() => navigate('/calendar')}
      >
        Calendar
      </button>

      <div className={styles.footerText}>family planner</div>

      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{selectedTask.name}</h3>
            <p className={styles.modalText}>
              <span style={{fontWeight: 'bold'}}>Description:</span><br/>
              {selectedTask.description || "No description provided"}
            </p>
            <p className={styles.modalText}>
              <span style={{fontWeight: 'bold'}}>Deadline:</span> {selectedTask.deadline}
            </p>
            <button 
              className={styles.okButton} 
              onClick={() => setSelectedTask(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {confirmationTask && (
        <div className={styles.modalOverlay} onClick={() => setConfirmationTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm completion</h3>
            <p className={styles.modalText}>
              Did you really complete "{confirmationTask.name}"?
            </p>
            <div className={styles.confirmationButtons}>
              <button 
                className={`${styles.okButton} ${styles.yesButton}`}
                onClick={() => handleCompleteTask(confirmationTask.id)}
              >
                Yes
              </button>
              <button 
                className={`${styles.okButton} ${styles.noButton}`}
                onClick={() => setConfirmationTask(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationTask && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmationTask(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm deletion</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete "{deleteConfirmationTask.name}"?
            </p>
            <div className={styles.confirmationButtons}>
              <button 
                className={`${styles.okButton} ${styles.yesButton}`}
                onClick={() => handleDeleteTask(deleteConfirmationTask.id)}
              >
                Yes
              </button>
              <button 
                className={`${styles.okButton} ${styles.noButton}`}
                onClick={() => setDeleteConfirmationTask(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;