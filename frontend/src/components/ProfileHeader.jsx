import { useAuth } from '../contexts/AuthContext';

const ProfileHeader = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="profile-header-mini">
      <div className="mini-avatar">{user.name?.charAt(0).toUpperCase()}</div>
      <div>
        <p className="mini-name">{user.name}</p>
        <p className="mini-role">{user.role}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;