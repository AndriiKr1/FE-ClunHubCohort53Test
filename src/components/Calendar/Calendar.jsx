import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../store/slices/taskSlice';
import { formatDateForApi } from '../../utils/dataMappers';
import ProfileHeader from '../ProfileHeader/ProfileHeader';
import leftArrow from '../../assets/images/left.png';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Calendar.css';
import { formatDateKey } from '../../utils/dateHelpers';

function TaskBubble({ task }) {
  const isCompleted = task.status === 'COMPLETED';
  const name = task.name || task.title || 'Untitled';
  
  return (
    <div className="task-bubble-wrapper">
      <div className={`task-bubble ${isCompleted ? 'completed-task' : ''}`}>
        {name}
      </div>
      <span className="tooltip">
        {name} 
        {isCompleted ? ' (Completed)' : ' (Due date)'}
      </span>
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

  useEffect(() => {
    const fetchMonthTasks = async () => {
      try {
        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);

        const fromDate = formatDateForApi(startDate);
        const toDate = formatDateForApi(endDate);
      
        await dispatch(fetchTasks({ 
          fromDate, 
          toDate, 
          includeCompleted: true // Important: include completed tasks
        }));
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

  const getTasksForDay = (day) => {
    const key = formatDateKey(currentYear, currentMonth, day);
  
    return (tasksByDate[key] || []).filter(task => {
      if (task.status === 'COMPLETED') {
        // Порівнюємо з датою завершення
        const completionDate = task.completionDate?.split('T')[0];
        return completionDate === key;
      } else {
        // Порівнюємо з дедлайном
        return task.deadline?.startsWith(key);
      }
    });
  };

  const getFirstDayOfMonth = () => new Date(currentYear, currentMonth, 1).getDay();
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
        <ProfileHeader />
      </div>

      <div className="completed-tasks-title">Tasks Calendar</div>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-box">
        <div className="calendar-header">
          <button onClick={prevMonth}>◀</button>

          <DatePicker
            selected={new Date(currentYear, currentMonth)}
            onChange={(date) => {
              setYear(date.getFullYear());
              setMonth(date.getMonth());
            }}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            customInput={
              <span className="calendar-custom-label">
                {new Date(currentYear, currentMonth).toLocaleString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            }
          />

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
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="calendar-cell empty"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const taskList = getTasksForDay(day);
              const completedTasks = taskList.filter(task => task.status === 'COMPLETED');
              const activeTasks = taskList.filter(task => task.status !== 'COMPLETED');

              return (
                <div 
                  key={day} 
                  className={`calendar-cell ${isToday(day) ? 'today' : ''}`} 
                  onClick={() => handleTaskClick(day)}
                >
                  <div className="day-number">{day}</div>

                  {taskList.length > 0 && (
                    <div className="task-count">
                      {completedTasks.length > 0 && (
                        <span className="completed-count">{completedTasks.length} completed</span>
                      )}
                      {activeTasks.length > 0 && (
                        <span className="active-count">{activeTasks.length} Task</span>
                      )}
                    </div>
                  )}

                  {/* Display up to 2 tasks, prioritizing completed ones first */}
                  {taskList.slice(0, 2).map((task, i) => (
                    <TaskBubble key={i} task={task} />
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

      <div className="back-section">
        <img
          src={leftArrow}
          alt="back"
          className="back-arrow-img"
          onClick={() => navigate('/dashboard')}
        />
        <p className="footer-title">family planner</p>
      </div>
    </div>
  );
};

export default Calendar;