import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../store/slices/authSlice';
import styles from './RegisterPage.module.css';
import clanHubLogo from '../../assets/images/Logo2.png';



const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /*const avatarOptions = [
    { id: 'avatar1', image: avatar1 },
    { id: 'avatar2', image: avatar2 },
    { id: 'avatar3', image: avatar3 },
    { id: 'avatar4', image: avatar4 },
  ];*/
  
  const [formData, setFormData] = useState({
    username: '',
    //age: '',
    //avatar: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

 /* const handleAvatarSelect = (avatarId) => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarId
    }));
    
    if (errors.avatar) {
      setErrors(prev => ({
        ...prev,
        avatar: ''
      }));
    }
  };
*/
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    /*
    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(formData.age) || parseInt(formData.age) <= 0) {
      newErrors.age = "Please enter a valid age";
    }
    
    if (!formData.avatar.trim()) {
      newErrors.avatar = "Please choose an avatar";
    } */

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      
      await dispatch(registerUser(formData)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      setErrors({
        submit: error.message || 'Error while registering. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.content}>
         {/* Logo */}
        <div className={styles.logoContainer}>
          <img src={clanHubLogo} alt="ClanHub Logo" className={styles.logo} />
        </div>

        {/* Registration form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.inputGroup}>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className={styles.input}
              disabled={isLoading}
            />
            {errors.username && <span className={styles.error}>{errors.username}</span>}
          </div>

          {/* Age form 
          <div className={styles.inputGroup}>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age"
              className={styles.input}
              disabled={isLoading}
              min="1"
            />
            {errors.age && <span className={styles.error}>{errors.age}</span>}
          </div>
          
           Avatar selection 
          <div className={styles.inputGroup}>
            <div className={styles.avatarLabel}>Choose your avatar...</div>
            <div className={styles.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <div 
                  key={avatar.id}
                  className={`${styles.avatarItem} ${formData.avatar === avatar.id ? styles.selectedAvatar : ''}`}
                  onClick={() => handleAvatarSelect(avatar.id)}
                >
                  <img 
                    src={avatar.image} 
                    alt={`Avatar ${avatar.id}`} 
                    className={styles.avatarImage}
                  />
                </div>
              ))}
            </div>
            {errors.avatar && <span className={styles.error}>{errors.avatar}</span>}
          </div>
          
*/}

          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E-mail"
              className={styles.input}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={styles.input}
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>

          {errors.submit && <div className={styles.submitError}>{errors.submit}</div>}

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creation...' : 'Create Account'}
          </button>
        </form>

        {/* Footer Text */}
        <div className={styles.footerText}>
          <p>family planner</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;