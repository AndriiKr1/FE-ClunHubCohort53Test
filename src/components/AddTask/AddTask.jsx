import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './AddTask.module.css';
import ProfileHeader from '../ProfileHeader/ProfileHeader';
import leftIcon from '../../assets/images/left.png';
import checkmarkIcon from '../../assets/images/checkmark1.png';

const AddTask = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { taskToEdit, isEditing } = location.state || {};
    
    const [taskName, setTaskName] = useState('');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [errors, setErrors] = useState({
        taskName: '',
        deadline: ''
    });

    useEffect(() => {
        if (isEditing && taskToEdit) {
            setTaskName(taskToEdit.name);
            setDeadline(taskToEdit.deadline);
            setDescription(taskToEdit.description || '');
        }
    }, [isEditing, taskToEdit]);

    const handleBack = () => navigate('/dashboard');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newErrors = {
            taskName: !taskName.trim() ? 'Please enter task name' : '',
            deadline: !deadline ? 'Please select deadline' : ''
        };
        
        setErrors(newErrors);
        
        if (newErrors.taskName || newErrors.deadline) return;
        
        const existingTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        if (isEditing && taskToEdit) {
            const updatedTasks = existingTasks.map(task => 
                task.id === taskToEdit.id
                    ? { ...task, name: taskName, deadline, description }
                    : task
            );
            
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
            setShowSuccess(true);
        } else {
            const newTask = {
                id: Date.now(),
                name: taskName,
                deadline,
                description,
                completed: false
            };
            
            // Добавляем новую задачу в начало массива
            localStorage.setItem('tasks', JSON.stringify([newTask, ...existingTasks]));
            setShowSuccess(true);
        }
    };

    const handleOk = () => {
        setShowSuccess(false);
        navigate('/dashboard', { state: { shouldRefresh: true } });
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className={styles.addTaskContainer}>
            <ProfileHeader />
            
            <div className={styles.contentWrapper}>
                <input
                    type="text"
                    value={taskName}
                    onChange={(e) => {
                        setTaskName(e.target.value);
                        setErrors({...errors, taskName: ''});
                    }}
                    placeholder={isEditing ? "Edit task name" : "Enter task name"}
                    className={`${styles.taskTitleInput} ${errors.taskName ? styles.errorInput : ''}`}
                />
                {errors.taskName && <p className={styles.errorMessage}>{errors.taskName}</p>}

                <form onSubmit={handleSubmit} className={styles.taskForm}>
                    <div className={styles.deadlineContainer}>
                        <span className={styles.deadlineLabel}>Deadline:</span>
                        <input
                            type="date"
                            value={deadline}
                            onChange={(e) => {
                                setDeadline(e.target.value);
                                setErrors({...errors, deadline: ''});
                            }}
                            className={`${styles.dateInput} ${errors.deadline ? styles.errorInput : ''}`}
                            min={today}
                        />
                        {errors.deadline && <p className={styles.errorMessage}>{errors.deadline}</p>}
                    </div>

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter task description..."
                        className={styles.descriptionInput}
                        rows={6}
                    />

                    <div className={styles.actionButtonsContainer}>
                        <div className={styles.actionButtons}>
                            <img 
                                src={leftIcon} 
                                alt="back" 
                                onClick={handleBack} 
                                className={styles.leftIcon}
                            />
                            <img 
                                src={checkmarkIcon} 
                                alt={isEditing ? "save changes" : "save"} 
                                onClick={handleSubmit} 
                                className={styles.checkmarkIcon}
                            />
                        </div>
                    </div>
                </form>
            </div>

            {showSuccess && (
                <div className={styles.successPopup}>
                    <div className={styles.popupContent}>
                        <p>Task "{taskName}" {isEditing ? 'updated' : 'added'} successfully!</p>
                        <button 
                            className={styles.okButton}
                            onClick={handleOk}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.footer}>family planner</div>
        </div>
    );
};

export default AddTask;