import React  from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import styles from './ProfileHeader.module.css';

import avatar1 from '../../assets/avatars/avatar1.png';
import avatar2 from '../../assets/avatars/avatar2.png';
import avatar3 from '../../assets/avatars/avatar3.png';
import avatar4 from '../../assets/avatars/avatar4.png';
import avatar5 from '../../assets/avatars/avatar5.png';
import avatar6 from '../../assets/avatars/avatar6.png';

const avatarMap = {
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
};

const ProfileHeader = () => {
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  
  
  const username = user?.username || '';
  const age = user?.age || '';
  const avatarId = user?.avatarId || 'avatar1';
  const selectedAvatar = avatarMap[avatarId] || avatar1;
  


  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
<div className={styles.profileHeader}>
      {user ? (
        <>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Log out
          </button>
          <img src={selectedAvatar} alt="Avatar" className={styles.avatar} />
          <div className={styles.userInfo}>
            <div className={styles.inputDisabled}>{username}</div>
            <div className={styles.inputDisabled}>{age}</div>
          </div>
        </>
      ) : (
        <div className={styles.noUserInfo}>
          <button 
            className={styles.loginButton}
            onClick={() => navigate('/login')}
          >
            Log in
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
