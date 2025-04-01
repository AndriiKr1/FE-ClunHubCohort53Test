import React from 'react';
import { useSelector } from 'react-redux';
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

const ProfileHeader = ({ onLogout }) => {
  const user = useSelector((state) => state.auth.user) || {};
  const { username, age, avatarId } = user;

  const selectedAvatar = avatarMap[avatarId] || avatar1;

  return (
    <div className={styles.profileHeader}>
  {username && (
    <>
      <button className={styles.logoutButton} onClick={onLogout}>
        Log out
      </button>
      <img src={selectedAvatar} alt="Avatar" className={styles.avatar} />
      <div className={styles.userInfo}>
        <div className={styles.inputDisabled}>{username}</div>
        <div className={styles.inputDisabled}>{age}</div>
      </div>
    </>
  )}
</div>

  );
};

export default ProfileHeader;
